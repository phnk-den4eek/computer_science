// script.js — логіка перевірки тесту (12 питань, по 1 балу)
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('quiz-form');
    if (!form) return; // сторінка може бути index.html
    const resultEl = document.getElementById('result');
    const teacherNote = document.getElementById('teacher-note');
    const showAnswersBtn = document.getElementById('show-answers');
    const resetBtn = document.getElementById('reset-quiz');

    // Entry overlay elements (role selection)
    const entryOverlay = document.getElementById('entry-overlay');
    const entryStudent = document.getElementById('entry-student');
    const entryTeacher = document.getElementById('entry-teacher');
    const teacherLogin = document.getElementById('teacher-login');
    const teacherPass = document.getElementById('teacher-pass');
    const teacherCancel = document.getElementById('teacher-cancel');
    const teacherError = document.getElementById('teacher-error');

    let teacherMode = false;

    const teacherPanel = document.getElementById('teacher-panel');
    const teacherShowAnswersBtn = document.getElementById('teacher-show-answers');
    const teacherLogoutBtn = document.getElementById('teacher-logout');

    function closeOverlay() {
        if (entryOverlay) {
            entryOverlay.hidden = true;
            entryOverlay.style.display = 'none';
            entryOverlay.setAttribute('aria-hidden', 'true');
        }
    }

    // Student: просто закриваємо overlay
    if (entryStudent) entryStudent.addEventListener('click', function () {
        teacherMode = false;
        closeOverlay();
        // ensure answers locked for students until submit
        if (showAnswersBtn) { showAnswersBtn.disabled = true; showAnswersBtn.setAttribute('aria-disabled','true'); }
        // показуємо форму тесту (на випадок, якщо були приховані)
        if (form) { form.style.display = ''; }
        if (teacherPanel) { teacherPanel.hidden = true; teacherPanel.style.display = 'none'; }
        // підставити фокус у поле імені
        const nameField = document.getElementById('student-name');
        if (nameField) { nameField.focus(); }
    });

    // Teacher: показати форму паролю
    if (entryTeacher) entryTeacher.addEventListener('click', function () {
        if (teacherLogin) {
            teacherLogin.hidden = false;
            teacherLogin.style.display = 'flex';
        }
        teacherPass && teacherPass.focus();
    });

    // Відміна логіна
    if (teacherCancel) teacherCancel.addEventListener('click', function () {
        if (teacherLogin) {
            teacherLogin.hidden = true;
            teacherLogin.style.display = 'none';
        }
        teacherPass && (teacherPass.value = '');
        teacherError && (teacherError.hidden = true);
    });

    // Обробка submit форми вчителя
    if (teacherLogin) teacherLogin.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const val = teacherPass ? teacherPass.value.trim() : '';
        if (val === '505') {
            teacherMode = true;
            // розблокувати показ відповідей для вчителя
            if (showAnswersBtn) { showAnswersBtn.disabled = false; showAnswersBtn.removeAttribute('aria-disabled'); }
            if (teacherNote) teacherNote.hidden = false;
            closeOverlay();
            // замінити вигляд: сховати форму тесту і показати панель вчителя
            if (form) { form.style.display = 'none'; }
            if (teacherPanel) { teacherPanel.hidden = false; teacherPanel.style.display = 'block'; }
            // рендеримо наявні подання
            renderSubmissions();
        } else {
            if (teacherError) { teacherError.hidden = false; teacherError.textContent = 'Невірний пароль. Спробуйте ще.'; }
        }
    });

    const answers = {
        q1: 'html',
        q2: 'style',
        q3: 'js',
        q4: 'link',
        q5: 'ol',
        q6: 'src',
        q7: 'https',
        q8: 'model',
        q9: 'h2',
        q10: 'color',
        q11: '===',
        q12: 'target_blank'
    };

    // helpers for submissions storage
    const SUB_KEY = 'quiz_submissions_v1';
    const TEST_ENABLED_KEY = 'quiz_test_enabled_v1';

    function getSubmissions(){
        try {
            const raw = localStorage.getItem(SUB_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e){ return []; }
    }

    function saveSubmissions(list){
        localStorage.setItem(SUB_KEY, JSON.stringify(list));
    }

    function addSubmission(obj){
        const list = getSubmissions();
        list.push(obj);
        saveSubmissions(list);
    }

    function clearSubmissions(){
        localStorage.removeItem(SUB_KEY);
    }

    function isTestEnabled(){
        const v = localStorage.getItem(TEST_ENABLED_KEY);
        if (v === null) return true; // default true
        return v === '1';
    }

    function setTestEnabled(val){
        localStorage.setItem(TEST_ENABLED_KEY, val ? '1' : '0');
    }

    // render submissions in teacher panel
    function renderSubmissions(){
        const container = document.getElementById('teacher-submissions');
        if (!container) return;
        const list = getSubmissions();
        if (!list.length){ container.innerHTML = '<div style="color:var(--muted)">Нема подань</div>'; return; }
        let html = '<table><thead><tr><th>№</th><th>Час</th><th>Учень</th><th>Бал</th><th>Дії</th></tr></thead><tbody>';
        list.slice().reverse().forEach((s, idx)=>{
            const i = list.length - idx;
            html += `<tr><td>${i}</td><td>${new Date(s.ts).toLocaleString()}</td><td>${escapeHtml(s.name||'—')}</td><td>${s.score}/12</td><td class="sub-actions"><button data-id="${s.id}" class="btn small" data-action="view">Переглянути</button><button data-id="${s.id}" class="btn small ghost" data-action="delete">Видалити</button></td></tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        // attach handlers
        container.querySelectorAll('button[data-action="view"]').forEach(b=>{
            b.addEventListener('click', ()=>{ const id = b.getAttribute('data-id'); viewSubmission(id); });
        });
        container.querySelectorAll('button[data-action="delete"]').forEach(b=>{
            b.addEventListener('click', ()=>{ const id = b.getAttribute('data-id'); deleteSubmission(id); });
        });
    }

    function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function viewSubmission(id){
        const list = getSubmissions();
        const item = list.find(x=>String(x.id)===String(id));
        if (!item){ alert('Не знайдено'); return; }
        let text = `Учень: ${item.name}\nЧас: ${new Date(item.ts).toLocaleString()}\nБал: ${item.score}/12\n\nВідповіді:\n`;
        Object.keys(item.answers||{}).forEach(k=>{ text += `${k}: ${item.answers[k]}\n`; });
        alert(text);
    }

    function deleteSubmission(id){
        if (!confirm('Видалити цю відповідь?')) return;
        let list = getSubmissions();
        list = list.filter(x=>String(x.id)!==String(id));
        saveSubmissions(list);
        renderSubmissions();
    }

    function exportCSV(){
        const list = getSubmissions();
        if (!list.length){ alert('Нема даних для експорту'); return; }
        const rows = [];
        const headers = ['id','ts','name','score'];
        // determine all question keys
        const qkeys = new Set();
        list.forEach(s=>{ Object.keys(s.answers||{}).forEach(k=>qkeys.add(k)); });
        const qarr = Array.from(qkeys).sort();
        const allHeaders = headers.concat(qarr);
        rows.push(allHeaders.join(','));
        list.forEach(s=>{
            const base = [s.id, s.ts, `"${(s.name||'').replace(/"/g,'""')}"`, s.score];
            const ans = qarr.map(k=>`"${((s.answers||{})[k]||'').toString().replace(/"/g,'""')}"`);
            rows.push(base.concat(ans).join(','));
        });
        const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'submissions.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }


    // Заблокувати кнопку показу відповідей до моменту перевірки
    if (showAnswersBtn) {
        showAnswersBtn.disabled = true;
        showAnswersBtn.setAttribute('aria-disabled', 'true');
    }

    // показати стан тесту в панелі
    function updateTestStatusDisplay(){
        const statusEl = document.getElementById('test-status');
        if (!statusEl) return;
        statusEl.textContent = isTestEnabled() ? 'увімкнено' : 'вимкнено';
    }
    updateTestStatusDisplay();

    // підключення контролів панелі вчителя
    const toggleTestBtn = document.getElementById('toggle-test');
    const exportCsvBtn = document.getElementById('export-csv');
    const clearSubBtn = document.getElementById('clear-submissions');
    if (toggleTestBtn) toggleTestBtn.addEventListener('click', function(){ setTestEnabled(!isTestEnabled()); updateTestStatusDisplay(); alert('Стан тесту змінено'); });
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportCSV);
    if (clearSubBtn) clearSubBtn.addEventListener('click', function(){ if (!confirm('Очистити всі відповіді?')) return; clearSubmissions(); renderSubmissions(); });

    function collectValues(form) {
        const data = {};
        const fm = new FormData(form);
        for (const [k, v] of fm.entries()) {
            if (!(k in data)) data[k] = v;
        }
        return data;
    }

    function clearHighlights(form) {
        form.querySelectorAll('.option').forEach(el => {
            el.classList.remove('correct', 'wrong');
        });
        form.querySelectorAll('input[type="text"]').forEach(el => {
            el.classList.remove('correct', 'wrong');
        });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // якщо тест відключено і це не вчитель — блокуємо
        if (!isTestEnabled() && !teacherMode) { alert('Тест тимчасово відключений.'); return; }
        clearHighlights(form);
        const vals = collectValues(form);
        let score = 0;

        Object.keys(answers).forEach(key => {
            const expected = answers[key].toString().trim().toLowerCase();

            // Якщо є варіанти (radio/checkbox)
            const options = form.querySelectorAll(`[name="${key}"]`);
            if (options && options.length) {
                options.forEach(opt => {
                    const label = opt.closest('.option') || opt.parentElement;
                    if (!label) return;
                    const val = opt.value.toString().trim().toLowerCase();
                    if (opt.checked) {
                        if (val === expected) {
                            score += 1;
                            label.classList.add('correct');
                        } else {
                            label.classList.add('wrong');
                        }
                    }
                    // підсвічуємо також правильний варіант
                    if (val === expected) label.classList.add('correct');
                });
            } else {
                // текстовий ввід
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    const given = (input.value || '').toString().trim().toLowerCase();
                    if (given === expected) {
                        score += 1;
                        input.classList.add('correct');
                    } else {
                        input.classList.add('wrong');
                    }
                }
            }
        });

        resultEl.textContent = `Ваша оцінка: ${score} / 12`;
        if (score === 12) resultEl.textContent += ' — Відмінно (12/12)';
        else if (score >= 10) resultEl.textContent += ' — Дуже добре';
        else if (score >= 8) resultEl.textContent += ' — Добре';
        else resultEl.textContent += ' — Потрібно покращити';

        teacherNote.hidden = false;
        // Розблокувати кнопку показу відповідей після перевірки
        if (showAnswersBtn) {
            showAnswersBtn.disabled = false;
            showAnswersBtn.removeAttribute('aria-disabled');
        }
        // збереження подання
        try {
            const studentNameField = form.querySelector('[name="studentName"]');
            const studentName = studentNameField ? (studentNameField.value || '').trim() : '';
            const submission = { id: Date.now() + Math.random().toString(36).slice(2,6), ts: Date.now(), name: studentName || 'Учень', answers: vals, score };
            addSubmission(submission);
        } catch (err) { console.error('save submission error', err); }

        // оновити список у панелі вчителя
        renderSubmissions();
        // Після перевірки, якщо вчитель не увійшов — панель лишається прихованою
        if (!teacherMode) {
            if (teacherPanel) { teacherPanel.hidden = true; teacherPanel.style.display = 'none'; }
            if (form) { form.style.display = ''; }
        }
    });

    showAnswersBtn.addEventListener('click', showAnswers);

    // вчительська кнопка з панелі також показує відповіді
    if (teacherShowAnswersBtn) teacherShowAnswersBtn.addEventListener('click', showAnswers);

    function showAnswers() {
        const lines = Object.keys(answers).map(k => `${k}: ${answers[k]}`);
        alert('Правильні відповіді:\n' + lines.join('\n'));
    }

    // вихід з вчительського режиму — показати форму і заблокувати показ відповідей
    if (teacherLogoutBtn) teacherLogoutBtn.addEventListener('click', function () {
        teacherMode = false;
        if (teacherPanel) { teacherPanel.hidden = true; teacherPanel.style.display = 'none'; }
        if (form) { form.style.display = ''; }
        if (showAnswersBtn) { showAnswersBtn.disabled = true; showAnswersBtn.setAttribute('aria-disabled','true'); }
        // показати overlay вибору ролі знову
        if (entryOverlay) { entryOverlay.hidden = false; entryOverlay.style.display = 'flex'; entryOverlay.removeAttribute('aria-hidden'); }
    });

    resetBtn.addEventListener('click', function () {
        form.reset();
        resultEl.textContent = '';
        teacherNote.hidden = true;
        clearHighlights(form);
        // Повернути кнопку показу відповідей у початковий заблокований стан, якщо не вчитель
        if (showAnswersBtn && !teacherMode) {
            showAnswersBtn.disabled = true;
            showAnswersBtn.setAttribute('aria-disabled', 'true');
        }
    });
});
