<?php
/**
 * Plugin Name: KodyW Draft Sync
 * Description: Atomically creates approved GitHub Pages projections as WordPress drafts.
 * Version: 1.0.0
 * Requires PHP: 7.2
 */

if (!defined('ABSPATH')) {
    exit;
}

const KODYW_DRAFT_SYNC_ROLE = 'kodyw_draft_sync';
const KODYW_DRAFT_SYNC_CAP = 'kodyw_sync_drafts';

function kodyw_draft_sync_activate(): void
{
    $role = get_role(KODYW_DRAFT_SYNC_ROLE);
    if (!$role) {
        $role = add_role(
            KODYW_DRAFT_SYNC_ROLE,
            'KodyW Draft Sync',
            []
        );
    }
    if (!$role) {
        return;
    }
    foreach (array_keys($role->capabilities) as $capability) {
        $role->remove_cap($capability);
    }
    $role->add_cap('read');
    $role->add_cap(KODYW_DRAFT_SYNC_CAP);
}
register_activation_hook(__FILE__, 'kodyw_draft_sync_activate');

function kodyw_draft_sync_account_is_safe(): bool
{
    $user = wp_get_current_user();
    if (!$user || !$user->exists()) {
        return false;
    }

    $roles = array_values($user->roles);
    sort($roles);
    if ($roles !== [KODYW_DRAFT_SYNC_ROLE]) {
        return false;
    }

    $enabled = [];
    foreach ($user->allcaps as $capability => $granted) {
        if ($granted) {
            $enabled[] = $capability;
        }
    }
    sort($enabled);
    $allowed = ['read', KODYW_DRAFT_SYNC_CAP, KODYW_DRAFT_SYNC_ROLE];
    sort($allowed);
    return $enabled === $allowed;
}

function kodyw_draft_sync_status(): WP_REST_Response
{
    $user = wp_get_current_user();
    return new WP_REST_Response(
        [
            'schema' => 'kodyw-draft-sync/1.0',
            'id' => $user->ID,
            'name' => $user->display_name,
            'role' => KODYW_DRAFT_SYNC_ROLE,
            'safe' => kodyw_draft_sync_account_is_safe(),
        ],
        200
    );
}

function kodyw_draft_sync_error(string $code, string $message, int $status): WP_Error
{
    return new WP_Error($code, $message, ['status' => $status]);
}

function kodyw_draft_sync_create(WP_REST_Request $request)
{
    global $wpdb;

    $payload = $request->get_json_params();
    if (!is_array($payload)) {
        return kodyw_draft_sync_error(
            'kodyw_invalid_payload',
            'Request body must be a JSON object.',
            400
        );
    }
    $allowed_keys = [
        'kind',
        'slug',
        'title',
        'content',
        'excerpt',
        'status',
        'date',
        'date_gmt',
    ];
    $unknown_keys = array_diff(array_keys($payload), $allowed_keys);
    if ($unknown_keys) {
        return kodyw_draft_sync_error(
            'kodyw_unknown_fields',
            'Request contains unsupported fields.',
            400
        );
    }

    $kind = isset($payload['kind']) ? $payload['kind'] : '';
    $slug = isset($payload['slug']) ? $payload['slug'] : '';
    $title = isset($payload['title']) ? $payload['title'] : '';
    $content = isset($payload['content']) ? $payload['content'] : '';
    $excerpt = isset($payload['excerpt']) ? $payload['excerpt'] : '';
    if (!in_array($kind, ['post', 'page'], true)) {
        return kodyw_draft_sync_error(
            'kodyw_invalid_kind',
            'Kind must be post or page.',
            400
        );
    }
    if (
        !is_string($slug)
        || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)
        || sanitize_title($slug) !== $slug
    ) {
        return kodyw_draft_sync_error(
            'kodyw_invalid_slug',
            'Slug is invalid.',
            400
        );
    }
    if (
        !is_string($title)
        || trim($title) === ''
        || strlen($title) > 500
        || !is_string($content)
        || strlen($content) > 2000000
    ) {
        return kodyw_draft_sync_error(
            'kodyw_invalid_content',
            'Title and content are required strings.',
            400
        );
    }
    if (!is_string($excerpt) || strlen($excerpt) > 5000) {
        return kodyw_draft_sync_error(
            'kodyw_invalid_excerpt',
            'Excerpt must be a string.',
            400
        );
    }
    if (isset($payload['status']) && $payload['status'] !== 'draft') {
        return kodyw_draft_sync_error(
            'kodyw_invalid_status',
            'Only draft creation is allowed.',
            400
        );
    }

    $post_date = isset($payload['date']) ? $payload['date'] : '';
    $post_date_gmt = isset($payload['date_gmt']) ? $payload['date_gmt'] : '';
    foreach ([$post_date, $post_date_gmt] as $candidate) {
        if (
            $candidate !== ''
            && (!is_string($candidate)
                || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/', $candidate))
        ) {
            return kodyw_draft_sync_error(
                'kodyw_invalid_date',
                'Dates must use YYYY-MM-DDTHH:MM:SS.',
                400
            );
        }
    }

    $lock_name = substr(
        'kodyw_draft_sync_' . hash('sha256', get_current_blog_id() . '|' . $kind . '|' . $slug),
        0,
        64
    );
    $locked = $wpdb->get_var(
        $wpdb->prepare('SELECT GET_LOCK(%s, %d)', $lock_name, 5)
    );
    if ((string) $locked !== '1') {
        return kodyw_draft_sync_error(
            'kodyw_lock_unavailable',
            'Could not acquire the draft creation lock.',
            503
        );
    }

    try {
        $query = "SELECT posts.ID, posts.post_status, posts.post_name
            FROM {$wpdb->posts} AS posts
            LEFT JOIN {$wpdb->postmeta} AS desired_slug
              ON desired_slug.post_id = posts.ID
             AND desired_slug.meta_key = '_wp_desired_post_slug'
            WHERE posts.post_type = %s
              AND (
                posts.post_name = %s
                OR (posts.post_status = 'trash' AND desired_slug.meta_value = %s)
              )
            ORDER BY posts.ID ASC
            LIMIT 1";
        $existing = $wpdb->get_row(
            $wpdb->prepare($query, $kind, $slug, $slug),
            ARRAY_A
        );
        if ($existing) {
            return new WP_REST_Response(
                [
                    'schema' => 'kodyw-draft-sync/1.0',
                    'created' => false,
                    'id' => (int) $existing['ID'],
                    'status' => $existing['post_status'],
                    'slug' => $slug,
                ],
                200
            );
        }

        $post = [
            'post_type' => $kind,
            'post_status' => 'draft',
            'post_name' => $slug,
            'post_title' => sanitize_text_field($title),
            'post_content' => wp_kses_post($content),
            'post_excerpt' => sanitize_textarea_field($excerpt),
            'post_author' => get_current_user_id(),
        ];
        if ($post_date !== '') {
            $post['post_date'] = str_replace('T', ' ', $post_date);
        }
        if ($post_date_gmt !== '') {
            $post['post_date_gmt'] = str_replace('T', ' ', $post_date_gmt);
        }

        $post_id = wp_insert_post(wp_slash($post), true);
        if (is_wp_error($post_id)) {
            return $post_id;
        }
        $created = get_post($post_id);
        if (!$created || $created->post_status !== 'draft' || $created->post_name !== $slug) {
            wp_delete_post($post_id, true);
            return kodyw_draft_sync_error(
                'kodyw_create_mismatch',
                'Created item did not preserve draft status and slug.',
                500
            );
        }
        return new WP_REST_Response(
            [
                'schema' => 'kodyw-draft-sync/1.0',
                'created' => true,
                'id' => (int) $created->ID,
                'status' => $created->post_status,
                'slug' => $created->post_name,
            ],
            201
        );
    } finally {
        $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock_name));
    }
}

function kodyw_draft_sync_register_routes(): void
{
    register_rest_route(
        'kodyw/v1',
        '/status',
        [
            'methods' => WP_REST_Server::READABLE,
            'callback' => 'kodyw_draft_sync_status',
            'permission_callback' => static function (): bool {
                return is_user_logged_in();
            },
        ]
    );
    register_rest_route(
        'kodyw/v1',
        '/drafts',
        [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => 'kodyw_draft_sync_create',
            'permission_callback' => 'kodyw_draft_sync_account_is_safe',
        ]
    );
}
add_action('rest_api_init', 'kodyw_draft_sync_register_routes');
