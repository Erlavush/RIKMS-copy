import './bootstrap';

const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content ?? '';

document.querySelectorAll('[data-doc-type-form]').forEach((form) => {
    const continueButton = form.querySelector('[data-doc-type-continue]');
    const cards = form.querySelectorAll('[data-doc-type-card]');
    const inputs = form.querySelectorAll('[data-doc-type-input]');

    inputs.forEach((input) => {
        input.addEventListener('change', () => {
            cards.forEach((card) => card.classList.toggle('selected', card.contains(input) && input.checked));
            continueButton.disabled = !Array.from(inputs).some((candidate) => candidate.checked);
        });
    });
});

document.querySelectorAll('[data-file-input]').forEach((input) => {
    input.addEventListener('change', () => {
        const dropzone = input.closest('[data-file-dropzone]');
        const title = dropzone?.querySelector('[data-file-title]');
        const continueButton = document.querySelector('[data-file-continue]');

        if (input.files.length > 0) {
            if (title) title.textContent = input.files[0].name;
            if (continueButton) continueButton.disabled = false;
        }
    });
});

document.querySelectorAll('[data-ai-form]').forEach((form) => {
    form.addEventListener('submit', () => {
        const button = form.querySelector('button');
        if (button) {
            button.disabled = true;
            button.textContent = 'Analyzing document...';
        }
    });
});

document.querySelectorAll('[data-rerun-ai]').forEach((button) => {
    button.addEventListener('click', () => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = button.dataset.rerunAi;
        form.innerHTML = `<input type="hidden" name="_token" value="${csrf()}">`;
        document.body.appendChild(form);
        form.submit();
    });
});

const syncSdgButton = (form) => {
    const checked = form.querySelectorAll('[data-sdg-input]:checked').length > 0;
    const button = form.querySelector('[data-sdg-continue]');
    if (button) button.disabled = !checked;
};

document.querySelectorAll('[data-sdg-form]').forEach((form) => {
    form.querySelectorAll('[data-sdg-input]').forEach((input) => {
        input.addEventListener('change', () => syncSdgButton(form));
    });

    form.querySelector('[data-apply-sdg]')?.addEventListener('click', () => {
        form.querySelectorAll('[data-sdg-input]').forEach((input) => {
            input.checked = ['9', '16', '8'].includes(input.value);
        });
        syncSdgButton(form);
    });
});

document.querySelectorAll('[data-select-all-public]').forEach((button) => {
    button.addEventListener('click', () => {
        button.closest('.public-selector')?.querySelectorAll('[data-public-field]').forEach((input) => input.checked = true);
    });
});

document.querySelectorAll('[data-clear-public]').forEach((button) => {
    button.addEventListener('click', () => {
        button.closest('.public-selector')?.querySelectorAll('[data-public-field]').forEach((input) => input.checked = false);
    });
});

document.querySelectorAll('[data-access-form]').forEach((form) => {
    const sync = () => {
        const value = form.querySelector('[data-access-input]:checked')?.value;
        form.querySelector('[data-embargo-field]')?.style.setProperty('display', value === 'embargo_until_date' ? 'grid' : 'none');
        form.querySelector('[data-external-field]')?.style.setProperty('display', value === 'external_link_only' ? 'grid' : 'none');
    };

    form.querySelectorAll('[data-access-input]').forEach((input) => input.addEventListener('change', sync));
    sync();
});

document.querySelectorAll('[data-use-account-email]').forEach((button) => {
    button.addEventListener('click', () => {
        const input = document.querySelector('[data-owner-email]');
        if (input) input.value = button.dataset.email;
    });
});

document.querySelectorAll('[data-performance-form]').forEach((form) => {
    const rows = form.querySelector('[data-performance-rows]');

    const recalc = (row) => {
        const target = parseFloat(row.querySelector('[data-target]')?.value ?? '0');
        const actual = parseFloat(row.querySelector('[data-actual]')?.value ?? '0');
        const output = row.querySelector('[data-accomplishment]');
        const percentage = target > 0 ? ((actual / target) * 100) : 0;
        if (output) output.textContent = `${percentage.toFixed(2)}%`;
    };

    const bindRow = (row) => {
        row.querySelectorAll('[data-target], [data-actual]').forEach((input) => {
            input.addEventListener('input', () => recalc(row));
        });
    };

    rows?.querySelectorAll('.performance-row:not(.heading)').forEach(bindRow);

    form.querySelector('[data-add-performance-row]')?.addEventListener('click', () => {
        const index = rows.querySelectorAll('.performance-row:not(.heading)').length;
        const row = document.createElement('div');
        row.className = 'performance-row';
        row.innerHTML = `
            <input name="rows[${index}][activity_output_indicator]" placeholder="Activity / Output / Indicator">
            <input name="rows[${index}][target]" type="number" step="0.01" data-target>
            <input name="rows[${index}][actual]" type="number" step="0.01" data-actual>
            <output data-accomplishment>0%</output>
            <select name="rows[${index}][status]"><option>Not Started</option><option selected>Ongoing</option><option>Completed</option><option>Delayed</option><option>Exceeded</option></select>
        `;
        rows.appendChild(row);
        bindRow(row);
    });
});

document.querySelectorAll('[data-financial-form]').forEach((form) => {
    const allotted = form.querySelector('[data-allotted]');
    const utilized = form.querySelector('[data-utilized]');
    const remaining = form.querySelector('[data-remaining]');
    const utilization = form.querySelector('[data-utilization]');

    const sync = () => {
        const budget = parseFloat(allotted?.value ?? '0');
        const spent = parseFloat(utilized?.value ?? '0');
        if (remaining) remaining.textContent = (budget - spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (utilization) utilization.textContent = budget > 0 ? `${((spent / budget) * 100).toFixed(2)}%` : '0.00%';
    };

    allotted?.addEventListener('input', sync);
    utilized?.addEventListener('input', sync);
    sync();
});

document.querySelectorAll('[data-apply-pap]').forEach((button) => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-pap-category]').forEach((input) => {
            input.checked = ['Research and Development', 'Regional Development'].includes(input.value);
        });
    });
});

document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
        const field = button.closest('div').querySelector('[data-password-field]');
        field.type = field.type === 'password' ? 'text' : 'password';
    });
});
