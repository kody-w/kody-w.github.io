// Frame-by-frame Dynamics 365 simulation proof
(function () {
  var root = document.getElementById('d365-sim-app');
  var simulation = window.d365Simulation;

  if (!root || !simulation || !simulation.frames || simulation.frames.length === 0) {
    return;
  }

  var currentIndex = 0;

  function formatCurrency(value) {
    return '$' + Number(value || 0).toLocaleString('en-US');
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

  function renderFrame(index) {
    var frame = simulation.frames[index];
    var progress = index + 1;

    root.innerHTML = '' +
      '<div class="d365-shell">' +
        '<section class="d365-hero">' +
          '<div class="d365-kicker">General state machine proof</div>' +
          '<h2>' + escapeHtml(frame.label) + '</h2>' +
          '<p class="d365-summary">' + escapeHtml(frame.summary) + '</p>' +
          '<div class="d365-controls">' +
            '<button class="d365-button" data-d365-prev ' + (index === 0 ? 'disabled' : '') + '>Previous frame</button>' +
            '<input class="d365-range" type="range" min="0" max="' + (simulation.frames.length - 1) + '" value="' + index + '" data-d365-range>' +
            '<button class="d365-button" data-d365-next ' + (index === simulation.frames.length - 1 ? 'disabled' : '') + '>Next frame</button>' +
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
    var next = root.querySelector('[data-d365-next]');
    var range = root.querySelector('[data-d365-range]');

    if (prev) {
      prev.addEventListener('click', function () {
        currentIndex = Math.max(0, currentIndex - 1);
        renderFrame(currentIndex);
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        currentIndex = Math.min(simulation.frames.length - 1, currentIndex + 1);
        renderFrame(currentIndex);
      });
    }

    if (range) {
      range.addEventListener('input', function () {
        currentIndex = Number(this.value);
        renderFrame(currentIndex);
      });
    }
  }

  renderFrame(currentIndex);
})();
