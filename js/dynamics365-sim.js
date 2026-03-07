// Frame-by-frame Dynamics 365 simulation proof
(function () {
  var root = document.getElementById('d365-sim-app');
  var simulation = window.d365Simulation;
  var runtime = simulation && simulation.runtime ? simulation.runtime : {};

  if (!root || !simulation || !simulation.frames || simulation.frames.length === 0) {
    return;
  }

  var currentIndex = 0;
  var isPlaying = false;
  var playbackTimer = null;
  var runtimeLabel = runtime.label || 'Runtime projection';
  var frameIntervalMs = Math.max(500, Number(runtime.frameIntervalMs || runtime.intervalMs || 1800));
  var endBehavior = runtime.endBehavior === 'loop' ? 'loop' : 'stop';

  function formatCurrency(value) {
    return '$' + Number(value || 0).toLocaleString('en-US');
  }

  function formatInterval(value) {
    return (Math.round((Number(value) / 100)) / 10).toLocaleString('en-US') + 's';
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openPipeline(frame) {
    return (frame.entities.opportunities || []).reduce(function (total, opportunity) {
      return opportunity.stage.indexOf('Closed') === 0 ? total : total + Number(opportunity.amount || 0);
    }, 0);
  }

  function openCases(frame) {
    return (frame.entities.cases || []).filter(function (item) {
      return item.status !== 'Resolved' && item.status !== 'Closed';
    }).length;
  }

  function activeTasks(frame) {
    return (frame.entities.tasks || []).filter(function (item) {
      return item.status !== 'Done' && item.status !== 'Closed';
    }).length;
  }

  function activeAutomations(frame) {
    return (frame.automations || []).filter(function (item) {
      return item.status !== 'Complete';
    }).length;
  }

  function atRiskAccounts(frame) {
    return (frame.entities.accounts || []).filter(function (item) {
      return item.health === 'At Risk' || item.health === 'Watch';
    }).length;
  }

  function renderTable(title, rows, columns) {
    if (!rows || rows.length === 0) {
      return '<section class="d365-panel"><h3>' + title + '</h3><p class="d365-empty">No records in this frame.</p></section>';
    }

    var header = columns.map(function (column) {
      return '<th>' + escapeHtml(column.label) + '</th>';
    }).join('');

    var body = rows.map(function (row) {
      return '<tr>' + columns.map(function (column) {
        return '<td>' + escapeHtml(row[column.key]) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    return '<section class="d365-panel">' +
      '<h3>' + title + '</h3>' +
      '<div class="d365-table-wrap">' +
      '<table class="d365-table"><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table>' +
      '</div>' +
      '</section>';
  }

  function renderMachineStates(machine) {
    return Object.keys(machine).map(function (key) {
      return '<div class="d365-state-item">' +
        '<span class="d365-state-label">' + escapeHtml(key) + '</span>' +
        '<strong class="d365-state-value">' + escapeHtml(machine[key]) + '</strong>' +
      '</div>';
    }).join('');
  }

  function renderTransitions(transitions) {
    return transitions.map(function (item) {
      return '<li>' +
        '<strong>' + escapeHtml(item.entity) + '</strong>' +
        '<span>' + escapeHtml(item.from) + ' -> ' + escapeHtml(item.to) + '</span>' +
        '<p>' + escapeHtml(item.note) + '</p>' +
      '</li>';
    }).join('');
  }

  function renderAutomations(items) {
    if (!items || items.length === 0) {
      return '<p class="d365-empty">No automations fired in this frame.</p>';
    }

    return '<ul class="d365-automation-list">' + items.map(function (item) {
      return '<li>' +
        '<strong>' + escapeHtml(item.id) + '</strong>' +
        '<span>' + escapeHtml(item.trigger) + '</span>' +
        '<p>' + escapeHtml(item.action) + '</p>' +
        '<em>' + escapeHtml(item.status) + '</em>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function lineageModeClass(mode) {
    if (mode === 'reference') {
      return 'is-reference';
    }

    if (mode === 'derived') {
      return 'is-derived';
    }

    return 'is-embedded';
  }

  function renderLineage(items) {
    if (!items || items.length === 0) {
      return '<p class="d365-empty">This frame carries all required state directly.</p>';
    }

    return '<ul class="d365-lineage-list">' + items.map(function (item) {
      return '<li>' +
        '<div class="d365-lineage-head">' +
          '<strong>' + escapeHtml(item.name) + '</strong>' +
          '<span class="d365-lineage-chip ' + lineageModeClass(item.mode) + '">' + escapeHtml(item.mode) + '</span>' +
        '</div>' +
        '<span>' + escapeHtml(item.source) + '</span>' +
        '<p>' + escapeHtml(item.note) + '</p>' +
      '</li>';
    }).join('') + '</ul>';
  }

  function clearPlaybackTimer() {
    if (playbackTimer) {
      window.clearTimeout(playbackTimer);
      playbackTimer = null;
    }
  }

  function manualNavigate(nextIndex) {
    if (isPlaying) {
      isPlaying = false;
      clearPlaybackTimer();
    }

    currentIndex = Math.max(0, Math.min(simulation.frames.length - 1, nextIndex));
    renderFrame(currentIndex);
  }

  function stopPlayback(shouldRender) {
    isPlaying = false;
    clearPlaybackTimer();

    if (shouldRender) {
      renderFrame(currentIndex);
    }
  }

  function queueNextTick() {
    clearPlaybackTimer();

    if (!isPlaying) {
      return;
    }

    playbackTimer = window.setTimeout(function () {
      if (currentIndex >= simulation.frames.length - 1) {
        if (endBehavior === 'loop') {
          currentIndex = 0;
        } else {
          stopPlayback(true);
          return;
        }
      } else {
        currentIndex += 1;
      }

      renderFrame(currentIndex);
      queueNextTick();
    }, frameIntervalMs);
  }

  function startPlayback() {
    if (simulation.frames.length < 2) {
      return;
    }

    if (currentIndex >= simulation.frames.length - 1) {
      currentIndex = 0;
    }

    isPlaying = true;
    renderFrame(currentIndex);
    queueNextTick();
  }

  function renderFrame(index) {
    var frame = simulation.frames[index];
    var progress = index + 1;
    var runtimeStatusClass = isPlaying ? 'is-running' : 'is-paused';
    var runtimeStatusLabel = isPlaying ? 'Running' : 'Paused';

    root.innerHTML = '' +
      '<div class="d365-shell">' +
        '<section class="d365-hero">' +
          '<div class="d365-kicker">General state machine proof</div>' +
          '<h2>' + escapeHtml(frame.label) + '</h2>' +
          '<p class="d365-summary">' + escapeHtml(frame.summary) + '</p>' +
          '<div class="d365-runtime-row">' +
            '<div class="d365-runtime-pill ' + runtimeStatusClass + '">' + escapeHtml(runtimeLabel) + ': ' + runtimeStatusLabel + '</div>' +
            '<div class="d365-clock-detail">Static clock profile: ' + escapeHtml(formatInterval(frameIntervalMs)) + ' per frame / ' + escapeHtml(endBehavior) + ' at final frame</div>' +
          '</div>' +
          '<div class="d365-controls">' +
            '<div class="d365-control-cluster">' +
              '<button class="d365-button" data-d365-prev ' + (index === 0 ? 'disabled' : '') + '>Previous frame</button>' +
              '<button class="d365-button d365-button-primary" data-d365-play aria-pressed="' + (isPlaying ? 'true' : 'false') + '">' + (isPlaying ? 'Pause frame time' : 'Play in frame time') + '</button>' +
              '<button class="d365-button" data-d365-next ' + (index === simulation.frames.length - 1 ? 'disabled' : '') + '>Next frame</button>' +
            '</div>' +
            '<input class="d365-range" type="range" min="0" max="' + (simulation.frames.length - 1) + '" value="' + index + '" data-d365-range>' +
          '</div>' +
          '<div class="d365-meta">' +
            '<span><strong>Clock:</strong> ' + escapeHtml(frame.clock) + '</span>' +
            '<span><strong>Frame:</strong> ' + progress + ' / ' + simulation.frames.length + '</span>' +
          '</div>' +
          '<p class="d365-note">' + escapeHtml(frame.note) + '</p>' +
        '</section>' +

        '<section class="d365-stats">' +
          '<div class="d365-stat"><span>Open pipeline</span><strong>' + formatCurrency(openPipeline(frame)) + '</strong></div>' +
          '<div class="d365-stat"><span>Open cases</span><strong>' + openCases(frame) + '</strong></div>' +
          '<div class="d365-stat"><span>Active tasks</span><strong>' + activeTasks(frame) + '</strong></div>' +
          '<div class="d365-stat"><span>Live automations</span><strong>' + activeAutomations(frame) + '</strong></div>' +
          '<div class="d365-stat"><span>At-risk accounts</span><strong>' + atRiskAccounts(frame) + '</strong></div>' +
        '</section>' +

        '<div class="d365-grid">' +
          '<section class="d365-panel">' +
            '<h3>Machine state</h3>' +
            '<div class="d365-state-grid">' + renderMachineStates(frame.machine) + '</div>' +
          '</section>' +
          '<section class="d365-panel">' +
            '<h3>State lineage</h3>' +
            renderLineage(frame.lineage) +
          '</section>' +
          '<section class="d365-panel">' +
            '<h3>State transition log</h3>' +
            '<ul class="d365-transition-list">' + renderTransitions(frame.transitions) + '</ul>' +
          '</section>' +
        '</div>' +

        '<div class="d365-grid">' +
          renderTable('Accounts', frame.entities.accounts, [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'lifecycle', label: 'Lifecycle' },
            { key: 'owner', label: 'Owner' },
            { key: 'health', label: 'Health' }
          ]) +
          renderTable('Leads', frame.entities.leads, [
            { key: 'id', label: 'ID' },
            { key: 'company', label: 'Company' },
            { key: 'stage', label: 'Stage' },
            { key: 'score', label: 'Score' },
            { key: 'owner', label: 'Owner' }
          ]) +
        '</div>' +

        '<div class="d365-grid">' +
          renderTable('Opportunities', frame.entities.opportunities, [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'stage', label: 'Stage' },
            { key: 'amount', label: 'Amount' },
            { key: 'next', label: 'Next step' }
          ]) +
          renderTable('Cases', frame.entities.cases, [
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'severity', label: 'Severity' },
            { key: 'status', label: 'Status' },
            { key: 'owner', label: 'Owner' }
          ]) +
        '</div>' +

        '<div class="d365-grid">' +
          renderTable('Tasks', frame.entities.tasks, [
            { key: 'id', label: 'ID' },
            { key: 'queue', label: 'Queue' },
            { key: 'title', label: 'Task' },
            { key: 'status', label: 'Status' }
          ]) +
          '<section class="d365-panel"><h3>Automations</h3>' + renderAutomations(frame.automations) + '</section>' +
        '</div>' +
      '</div>';

    bindControls();
  }

  function bindControls() {
    var prev = root.querySelector('[data-d365-prev]');
    var play = root.querySelector('[data-d365-play]');
    var next = root.querySelector('[data-d365-next]');
    var range = root.querySelector('[data-d365-range]');

    if (prev) {
      prev.addEventListener('click', function () {
        manualNavigate(currentIndex - 1);
      });
    }

    if (play) {
      play.addEventListener('click', function () {
        if (isPlaying) {
          stopPlayback(true);
          return;
        }

        startPlayback();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        manualNavigate(currentIndex + 1);
      });
    }

    if (range) {
      range.addEventListener('input', function () {
        manualNavigate(Number(this.value));
      });
    }
  }

  renderFrame(currentIndex);

  if (runtime.autoPlay) {
    startPlayback();
  }
})();
