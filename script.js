// Data and Initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Navigation
    setupNavigation();
    
    // Mobile menu
    setupMobileMenu();
    
    // Load current date and time
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    
    // Load schedule
    loadTodaySchedule();
    loadWeeklySchedule();
    
    // Load tasks
    loadTasks();
    
    // Form handlers
    setupFormHandlers();
    
    // Load sample data if localStorage is empty
    checkAndLoadSampleData();
    
    // Setup highlight cards functionality
    setupHighlightCards();
    
    startFirebaseSync();
});

function initApp() {
    // Check if data exists in localStorage, if not initialize
    if (!localStorage.getItem('tasks')) {
        localStorage.setItem('tasks', JSON.stringify([]));
    }
    if (!localStorage.getItem('grades')) {
        localStorage.setItem('grades', JSON.stringify([]));
    }
    if (!localStorage.getItem('studyPlans')) {
        localStorage.setItem('studyPlans', JSON.stringify([]));
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(page => {
                page.style.display = 'none';
            });
            
            // Show selected page
            document.getElementById(`${pageId}-page`).style.display = 'block';
            
            // Update active nav link
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close mobile menu if open
            const mainNav = document.getElementById('main-nav');
            if (mainNav && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
            }
            
            // Load specific page data
            switch(pageId) {
                case 'tasks':
                    loadTasks();
                    break;
                case 'grades':
                    loadGrades();
                    break;
                case 'study-plan':
                    loadStudyPlans();
                    break;
                case 'holidays':
                    renderHolidayCalendar();
                    break;
            }
        });
    });
    
    // Default to dashboard page
    document.querySelector('nav a[data-page="dashboard"]').click();
}

// Feriados fixos para 2025
const HOLIDAYS_2025 = [
    '2025-01-01', // 1 de janeiro
    '2025-02-28', // 28 de fevereiro
    '2025-03-01', '2025-03-02', '2025-03-03', '2025-03-04', // 1-4 de março
    '2025-04-18', '2025-04-20', '2025-04-21', // 18, 20, 21 de abril
    '2025-05-01', '2025-05-11', // 1 e 11 de maio
    '2025-06-12', '2025-06-19', // 12 e 19 de junho
    '2025-10-15', '2025-10-28', // 15 e 28 de outubro
    '2025-11-15', '2025-11-20', // 15 e 20 de novembro
    '2025-12-24', '2025-12-25', '2025-12-31' // 24, 25 e 31 de dezembro
];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderHolidayCalendar() {
    const calendarBody = document.getElementById('holiday-calendar-body');
    const monthYearDisplay = document.getElementById('current-month-year');
    
    // Update month/year display
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    monthYearDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Get first day of month and total days in month
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Get today's date for comparison
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    
    // Get all events from tasks and study plans
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const studyPlans = JSON.parse(localStorage.getItem('studyPlans')) || [];
    
    calendarBody.innerHTML = '';
    
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Stop if we've rendered all days
        if (date > daysInMonth) break;
        
        const row = document.createElement('tr');
        
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < firstDay) {
                // Empty cells before first day
                cell.textContent = '';
            } else if (date > daysInMonth) {
                // Empty cells after last day
                cell.textContent = '';
            } else {
                // Regular day cell
                cell.textContent = date;
                
                // Format date for comparison
                const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                
                // Check if weekend
                const dayOfWeek = new Date(currentYear, currentMonth, date).getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    cell.classList.add('weekend');
                }
                
                // Check if holiday
                if (HOLIDAYS_2025.includes(formattedDate)) {
                    cell.classList.add('holiday');
                }
                
                // Check if today
                if (isCurrentMonth && date === today.getDate()) {
                    cell.classList.add('today');
                }
                
                // Check if has events
                const dayEvents = [
                    ...tasks.filter(task => task.dueDate === formattedDate),
                    ...studyPlans.filter(plan => plan.targetDate === formattedDate)
                ];
                
                if (dayEvents.length > 0) {
                    cell.classList.add('event-day');
                    cell.dataset.date = formattedDate;
                    cell.dataset.events = JSON.stringify(dayEvents);
                }
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarBody.appendChild(row);
    }
    
    // Add event listeners to cells
    document.querySelectorAll('.holiday-calendar td[data-events]').forEach(cell => {
        cell.addEventListener('click', function() {
            showEventDetails(this.dataset.date, JSON.parse(this.dataset.events));
        });
    });
}

function showEventDetails(date, events) {
    const eventDetails = document.getElementById('event-details');
    const formattedDate = formatDate(date);
    
    if (events.length === 0) {
        eventDetails.innerHTML = `<p>Nenhum evento encontrado para ${formattedDate}</p>`;
        return;
    }
    
    let html = `<h4>Eventos em ${formattedDate}</h4>`;
    
    events.forEach(event => {
        if (event.title) { // Task
            html += `
                <div class="event-item">
                    <div class="event-title">${event.title}</div>
                    <div class="event-meta">
                        <span><i class="fas fa-book"></i> ${formatSubjectName(event.subject)}</span>
                        <span class="event-type">${event.type}</span>
                        ${event.completed ? '<span><i class="fas fa-check"></i> Concluído</span>' : ''}
                    </div>
                    ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
                </div>
            `;
        } else { // Study plan
            html += `
                <div class="event-item">
                    <div class="event-title">Plano de estudo: ${event.topic}</div>
                    <div class="event-meta">
                        <span><i class="fas fa-book"></i> ${formatSubjectName(event.subject)}</span>
                        <span class="event-type">Planejamento</span>
                        <span>${event.hours}h</span>
                    </div>
                    ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
                </div>
            `;
        }
    });
    
    eventDetails.innerHTML = html;
}

function changeMonth(offset) {
    currentMonth += offset;
    
    // Handle year transition
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    
    renderHolidayCalendar();
}

function setupHighlightCards() {
    // Add click handlers to highlight cards
    const todaySubjectsCard = document.getElementById('today-subjects-card');
    const pendingTasksCard = document.getElementById('pending-tasks-card');
    const nextTestCard = document.getElementById('next-test-card');
    const lowestGradeCard = document.getElementById('lowest-grade-card');

    if (todaySubjectsCard) {
        todaySubjectsCard.addEventListener('click', function() {
            document.querySelector('nav a[data-page="subjects"]').click();
        });
    }

    if (pendingTasksCard) {
        pendingTasksCard.addEventListener('click', function() {
            document.querySelector('nav a[data-page="tasks"]').click();
        });
    }

    if (nextTestCard) {
        nextTestCard.addEventListener('click', function() {
            document.querySelector('nav a[data-page="tasks"]').click();
            // Focus on next test
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const nextTest = tasks.find(task => task.type === 'prova' && !task.completed);
            if (nextTest) {
                document.getElementById('task-subject').value = nextTest.subject;
                document.getElementById('task-type').value = 'prova';
                document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (lowestGradeCard) {
        lowestGradeCard.addEventListener('click', function() {
            document.querySelector('nav a[data-page="grades"]').click();
        });
    }
}

function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options);
    
    // Verifica se é dia de semana (1-5 = Segunda a Sexta)
    const dayOfWeek = now.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Horários de aula (exemplo)
        const schedule = [
            { start: { hour: 13, minute: 0 }, end: { hour: 13, minute: 50 }, subject: 'Filosofia', teacher: 'André' },
            { start: { hour: 13, minute: 50 }, end: { hour: 14, minute: 40 }, subject: 'Física', teacher: 'Paulo' },
            { start: { hour: 14, minute: 40 }, end: { hour: 15, minute: 30 }, subject: 'Educação Física', teacher: 'Celso' },
            { start: { hour: 15, minute: 50 }, end: { hour: 16, minute: 40 }, subject: 'Química', teacher: 'Eliane' },
            { start: { hour: 16, minute: 40 }, end: { hour: 17, minute: 30 }, subject: 'Sociologia', teacher: 'Rafaela' }
        ];
        
        // Encontrar a aula atual
        let currentClass = null;
        for (const classInfo of schedule) {
            const classStart = new Date();
            classStart.setHours(classInfo.start.hour, classInfo.start.minute, 0, 0);
            
            const classEnd = new Date();
            classEnd.setHours(classInfo.end.hour, classInfo.end.minute, 0, 0);
            
            if (now >= classStart && now <= classEnd) {
                currentClass = classInfo;
                break;
            }
        }
        
        if (currentClass) {
            document.getElementById('current-period').textContent = 
                `Aula atual: ${currentClass.subject} (${currentClass.start.hour}:${String(currentClass.start.minute).padStart(2, '0')} - ${currentClass.end.hour}:${String(currentClass.end.minute).padStart(2, '0')})`;
        } else {
            document.getElementById('current-period').textContent = 'Nenhuma aula no momento';
        }
    } else {
        document.getElementById('current-period').textContent = 'Hoje é fim de semana!';
    }
}

function loadTodaySchedule() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    
    // Mapeia os dias da semana para as chaves do weeklySchedule
    const dayMap = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday'
    };
    
    // Se for fim de semana, mostra mensagem especial
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const tbody = document.getElementById('today-schedule');
        tbody.innerHTML = '<tr><td colspan="3">Hoje é fim de semana! Não há aulas.</td></tr>';
        document.getElementById('today-subjects-count').textContent = '0';
        return;
    }
    
    const dayKey = dayMap[dayOfWeek];
    if (!dayKey) return;
    
    const weeklySchedule = {
        monday: [
            { time: '13:30 - 13:50', subject: 'Filosofia', teacher: 'André' },
            { time: '13:50 - 14:40', subject: 'Física', teacher: 'Paulo' },
            { time: '14:40 - 15:30', subject: 'Educação Física', teacher: 'Celso' },
            { time: '15:50 - 16:40', subject: 'Química', teacher: 'Eliane' },
            { time: '16:40 - 17:30', subject: 'Sociologia', teacher: 'Rafaela' }
        ],
        tuesday: [
            { time: '13:00 - 13:50', subject: 'Português', teacher: 'Célia' },
            { time: '13:50 - 14:40', subject: 'Português', teacher: 'Célia'},
            { time: '14:40 - 15:30', subject: 'Artes', teacher: 'Gustavo'},
            { time: '15:50 - 16:40', subject: 'Inglês', teacher: '???' },
            { time: '16:40 - 17:30', subject: 'Geografi', teacher: 'Cátia/Mau'}
        ],
        wednesday: [
            { time: '13:00 - 13:50', subject: 'Educação Física', teacher: 'Celso' },
            { time: '13:50 - 14:40', subject: 'Matemática', teacher: 'José' },
            { time: '14:40 - 15:30', subject: 'Matemática', teacher: 'José' },
            { time: '15:50 - 16:40', subject: 'Geografia', teacher: 'Cátia' },
            { time: '16:40 - 17:30', subject: 'Química', teacher: 'Eliane' }
        ],
        thursday: [
            { time: '13:00 - 13:50', subject: 'Sociologia', teacher: 'Rafaela' },
            { time: '13:50 - 14:40', subject: 'História', teacher: 'Giovane'},
            { time: '14:40 - 15:30', subject: 'Física', teacher: 'Paulo'},
            { time: '15:50 - 16:40', subject: 'Português', teacher: 'Célia'},
            { time: '16:40 - 17:30', subject: 'Biologia', teacher: 'Sandra'}
        ],
        friday: [
            { time: '13:00 - 13:50', subject: 'História', teacher: 'Giovane'},
            { time: '13:50 - 14:40', subject: 'Espanhol', teacher: 'Douglas' },
            { time: '14:40 - 15:30', subject: 'Inglês', teacher: '???' },
            { time: '15:50 - 16:40', subject: 'Matemática', teacher: 'José' },
            { time: '16:40 - 17:30', subject: 'Biologia', teacher: 'Sandra'}
        ]
    };
    
    const todaySchedule = weeklySchedule[dayKey];
    
    const tbody = document.getElementById('today-schedule');
    tbody.innerHTML = '';
    
    todaySchedule.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.time}</td>
            <td>${item.subject}</td>
            <td>${item.teacher}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update today subjects count
    document.getElementById('today-subjects-count').textContent = todaySchedule.length;
}

function loadWeeklySchedule() {
    const weeklySchedule = {
        monday: [
            { time: '13:30 - 13:50', subject: 'Filosofia', teacher: 'André' },
            { time: '13:50 - 14:40', subject: 'Física', teacher: 'Paulo' },
            { time: '14:40 - 15:30', subject: 'Educação Física', teacher: 'Celso' },
            { time: '15:50 - 16:40', subject: 'Química', teacher: 'Eliane' },
            { time: '16:40 - 17:30', subject: 'Sociologia', teacher: 'Rafaela' }
        ],
        tuesday: [
            { time: '13:00 - 13:50', subject: 'Português', teacher: 'Célia' },
            { time: '13:50 - 14:40', subject: 'Português', teacher: 'Célia'},
            { time: '14:40 - 15:30', subject: 'Artes', teacher: 'Gustavo'},
            { time: '15:50 - 16:40', subject: 'Inglês', teacher: '???' },
            { time: '16:40 - 17:30', subject: 'Geografi', teacher: 'Cátia/Mau'}
        ],
        wednesday: [
            { time: '13:00 - 13:50', subject: 'Educação Física', teacher: 'Celso' },
            { time: '13:50 - 14:40', subject: 'Matemática', teacher: 'José' },
            { time: '14:40 - 15:30', subject: 'Matemática', teacher: 'José' },
            { time: '15:50 - 16:40', subject: 'Geografia', teacher: 'Cátia' },
            { time: '16:40 - 17:30', subject: 'Química', teacher: 'Eliane' }
        ],
        thursday: [
            { time: '13:00 - 13:50', subject: 'Sociologia', teacher: 'Rafaela' },
            { time: '13:50 - 14:40', subject: 'História', teacher: 'Giovane'},
            { time: '14:40 - 15:30', subject: 'Física', teacher: 'Paulo'},
            { time: '15:50 - 16:40', subject: 'Português', teacher: 'Célia'},
            { time: '16:40 - 17:30', subject: 'Biologia', teacher: 'Sandra'}
        ],
        friday: [
            { time: '13:00 - 13:50', subject: 'História', teacher: 'Giovane'},
            { time: '13:50 - 14:40', subject: 'Espanhol', teacher: 'Douglas' },
            { time: '14:40 - 15:30', subject: 'Inglês', teacher: '???' },
            { time: '15:50 - 16:40', subject: 'Matemática', teacher: 'José' },
            { time: '16:40 - 17:30', subject: 'Biologia', teacher: 'Sandra'}
        ]
    };
    
    // Load for today view
    const todayTbody = document.getElementById('today-schedule');
    todayTbody.innerHTML = '';
    
    weeklySchedule.monday.forEach(item => { // Assuming today is Monday for demo
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.time}</td>
            <td>${item.subject}</td>
            <td>${item.teacher}</td>
        `;
        todayTbody.appendChild(tr);
    });
    
    // Load for full weekly view
    const fullTbody = document.getElementById('full-weekly-schedule');
    fullTbody.innerHTML = '';
    
    // Create rows for each period
    for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${weeklySchedule.monday[i].time}</td>
            <td>${weeklySchedule.monday[i].subject}<br><small>${weeklySchedule.monday[i].teacher}</small></td>
            <td>${weeklySchedule.tuesday[i].subject}<br><small>${weeklySchedule.tuesday[i].teacher}</small></td>
            <td>${weeklySchedule.wednesday[i].subject}<br><small>${weeklySchedule.wednesday[i].teacher}</small></td>
            <td>${weeklySchedule.thursday[i].subject}<br><small>${weeklySchedule.thursday[i].teacher}</small></td>
            <td>${weeklySchedule.friday[i].subject}<br><small>${weeklySchedule.friday[i].teacher}</small></td>
        `;
        fullTbody.appendChild(tr);
    }
    
    // Highlight current day and period (demo: Monday 3rd period)
    const weeklyView = document.getElementById('weekly-schedule');
    if (weeklyView) {
        weeklyView.innerHTML = '';
        
        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Horário</th>
            <th class="current-day">Segunda</th>
            <th>Terça</th>
            <th>Quarta</th>
            <th>Quinta</th>
            <th>Sexta</th>
        `;
        weeklyView.appendChild(headerRow);
        
        // Create period rows
        for (let i = 0; i < 5; i++) {
            const tr = document.createElement('tr');
            const isCurrentPeriod = i === 3; // Demo: 4th period is current
            
            tr.innerHTML = `
                <td>${weeklySchedule.monday[i].time}</td>
                <td class="${isCurrentPeriod ? 'current-period' : ''} ${i === 0 ? 'current-day' : ''}">${weeklySchedule.monday[i].subject}<br><small>${weeklySchedule.monday[i].teacher}</small></td>
                <td class="${i === 0 ? 'current-day' : ''}">${weeklySchedule.tuesday[i].subject}<br><small>${weeklySchedule.tuesday[i].teacher}</small></td>
                <td class="${i === 0 ? 'current-day' : ''}">${weeklySchedule.wednesday[i].subject}<br><small>${weeklySchedule.wednesday[i].teacher}</small></td>
                <td class="${i === 0 ? 'current-day' : ''}">${weeklySchedule.thursday[i].subject}<br><small>${weeklySchedule.thursday[i].teacher}</small></td>
                <td class="${i === 0 ? 'current-day' : ''}">${weeklySchedule.friday[i].subject}<br><small>${weeklySchedule.friday[i].teacher}</small></td>
            `;
            weeklyView.appendChild(tr);
        }
    }
}

function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    
    // Update pending tasks count
    const pendingTasks = tasks.filter(task => !task.completed).length;
    document.getElementById('pending-tasks-count').textContent = pendingTasks;
    
    // Find next test
    const nextTest = tasks.find(task => task.type === 'prova' && !task.completed);
    if (nextTest) {
        document.getElementById('next-test-subject').textContent = formatSubjectName(nextTest.subject);
    } else {
        document.getElementById('next-test-subject').textContent = 'Nenhuma';
    }
    
    // For urgent tasks on dashboard
    const urgentTasksContainer = document.getElementById('urgent-tasks');
    if (urgentTasksContainer) {
        urgentTasksContainer.innerHTML = '';
        
        const urgentTasks = tasks.filter(task => 
            new Date(task.dueDate) <= new Date(new Date().setDate(new Date().getDate() + 3)) && 
            !task.completed
        ).slice(0, 3);
        
        if (urgentTasks.length === 0) {
            urgentTasksContainer.innerHTML = '<p>Nenhuma tarefa urgente encontrada.</p>';
        } else {
            urgentTasks.forEach(task => {
                const taskEl = document.createElement('div');
                taskEl.className = 'task-item';
                taskEl.innerHTML = `
                    <div class="task-content">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-book"></i> ${formatSubjectName(task.subject)}</span>
                            <span><i class="fas fa-calendar-day"></i> ${formatDate(task.dueDate)}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button><i class="fas fa-ellipsis-v"></i></button>
                    </div>
                `;
                urgentTasksContainer.appendChild(taskEl);
            });
        }
    }
    
    // For tasks page
    const tasksList = document.getElementById('tasks-list');
    if (tasksList) {
        tasksList.innerHTML = '';
        
        if (tasks.length === 0) {
            tasksList.innerHTML = '<p>Nenhuma tarefa encontrada. Adicione sua primeira tarefa!</p>';
        } else {
            tasks.forEach(task => {
                const priorityClass = getPriorityClass(task.priority);
                const completedClass = task.completed ? 'completed' : '';
                
                const taskEl = document.createElement('div');
                taskEl.className = `task-item ${completedClass}`;
                taskEl.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <div class="task-content">
                        <div class="task-title">${task.title} <span class="badge ${priorityClass}">${task.type}</span></div>
                        <div class="task-meta">
                            <span><i class="fas fa-book"></i> ${formatSubjectName(task.subject)}</span>
                            <span><i class="fas fa-calendar-day"></i> ${formatDate(task.dueDate)}</span>
                            ${task.completed ? '<span><i class="fas fa-check"></i> Concluído</span>' : ''}
                        </div>
                        ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="edit-task" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-task" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                tasksList.appendChild(taskEl);
            });
            
            // Add event listeners for checkboxes
            document.querySelectorAll('.task-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const taskId = this.getAttribute('data-id');
                    toggleTaskCompletion(taskId);
                });
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-task').forEach(button => {
                button.addEventListener('click', function() {
                    const taskId = this.getAttribute('data-id');
                    editTask(taskId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-task').forEach(button => {
                button.addEventListener('click', function() {
                    const taskId = this.getAttribute('data-id');
                    deleteTask(taskId);
                });
            });
        }
    }
    
    // For calendar view
    updateCalendarView();
}

function loadGrades() {
    let grades = JSON.parse(localStorage.getItem('grades')) || [];
    const gradesList = document.getElementById('grades-list');
    const subjectsGradesContainer = document.getElementById('subjects-grades-container');
    
    // Calculate averages for each subject
    const subjects = {
        matematica: { name: 'Matemática', grades: [] },
        portugues: { name: 'Português', grades: [] },
        ingles: { name: 'Inglês', grades: [] },
        espanhol: { name: 'Espanhol', grades: [] },
        artes: { name: 'Artes', grades: [] },
        filosofia: { name: 'Filosofia', grades: [] },
        sociologia: { name: 'Sociologia', grades: [] },
        educacao_fisica: { name: 'Educação Física', grades: [] },
        quimica: { name: 'Química', grades: [] },
        fisica: { name: 'Física', grades: [] },
        biologia: { name: 'Biologia', grades: [] },
        historia: { name: 'História', grades: [] },
        geografia: { name: 'Geografia', grades: [] }
    };
    
    grades.forEach(grade => {
        if (subjects[grade.subject]) {
            subjects[grade.subject].grades.push(grade.value);
        }
    });
    
    // Update subjects grades container
    if (subjectsGradesContainer) {
        subjectsGradesContainer.innerHTML = '';
        
        let lowestAverage = 10;
        let lowestSubject = '';
        
        Object.keys(subjects).forEach(subjectKey => {
            const subject = subjects[subjectKey];
            if (subject.grades.length > 0) {
                const average = calculateAverage(subject.grades);
                
                if (average < lowestAverage) {
                    lowestAverage = average;
                    lowestSubject = subject.name;
                }
                
                const subjectCard = document.createElement('div');
                subjectCard.className = 'subject-card';
                subjectCard.innerHTML = `
                    <h3>${subject.name}</h3>
                    <p>Notas: ${subject.grades.join(', ')}</p>
                    <p>Média: <span class="average">${average.toFixed(1)}</span></p>
                    <div class="progress-bar" style="margin-top: 10px;">
                        <div style="height: 5px; background-color: var(--border); width: 100%;">
                            <div style="height: 5px; background-color: var(--accent); width: ${average * 10}%;"></div>
                        </div>
                    </div>
                    <button class="btn btn-outline add-grade-btn" data-subject="${subjectKey}" style="margin-top: 10px; width: 100%;">
                        <i class="fas fa-plus"></i> Adicionar Nota
                    </button>
                `;
                subjectsGradesContainer.appendChild(subjectCard);
            }
        });
        
        // Update lowest average in dashboard
        const lowestAverageElement = document.getElementById('lowest-average');
        if (lowestSubject) {
            lowestAverageElement.textContent = `${lowestSubject}: ${lowestAverage.toFixed(1)}`;
        } else {
            lowestAverageElement.textContent = 'Nenhuma nota registrada';
        }
    }
    
    // Update grades list
    if (gradesList) {
        gradesList.innerHTML = '';
        
        if (grades.length === 0) {
            gradesList.innerHTML = '<tr><td colspan="6">Nenhuma nota registrada ainda.</td></tr>';
        } else {
            grades.forEach(grade => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatSubjectName(grade.subject)}</td>
                    <td>${grade.type}</td>
                    <td>${grade.description || '-'}</td>
                    <td>${formatDate(grade.date)}</td>
                    <td>${grade.value}</td>
                    <td>
                        <button class="edit-grade" data-id="${grade.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-grade" data-id="${grade.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                gradesList.appendChild(tr);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-grade').forEach(button => {
                button.addEventListener('click', function() {
                    const gradeId = this.getAttribute('data-id');
                    editGrade(gradeId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-grade').forEach(button => {
                button.addEventListener('click', function() {
                    const gradeId = this.getAttribute('data-id');
                    deleteGrade(gradeId);
                });
            });
            
            // Add event listeners for add grade buttons
            document.querySelectorAll('.add-grade-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const subject = this.getAttribute('data-subject');
                    document.getElementById('grade-subject').value = subject;
                    document.querySelector('nav a[data-page="grades"]').click();
                    document.getElementById('grade-form').scrollIntoView({ behavior: 'smooth' });
                });
            });
        }
    }
}

function calculateAverage(grades) {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((total, grade) => total + parseFloat(grade), 0);
    return sum / grades.length;
}

function loadStudyPlans() {
    let studyPlans = JSON.parse(localStorage.getItem('studyPlans')) || [];
    const studyPlansList = document.getElementById('study-plans-list');
    
    if (studyPlansList) {
        studyPlansList.innerHTML = '';
        
        if (studyPlans.length === 0) {
            studyPlansList.innerHTML = '<tr><td colspan="6">Nenhum plano de estudo criado ainda.</td></tr>';
        } else {
            studyPlans.forEach(plan => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatSubjectName(plan.subject)}</td>
                    <td>${plan.topic}</td>
                    <td>${formatDate(plan.targetDate)}</td>
                    <td>${plan.hours}h</td>
                    <td>
                        <div style="height: 5px; background-color: var(--border); width: 100%;">
                            <div style="height: 5px; background-color: var(--accent); width: ${plan.progress || 0}%;"></div>
                        </div>
                    </td>
                    <td>
                        <button class="edit-plan" data-id="${plan.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-plan" data-id="${plan.id}"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                studyPlansList.appendChild(tr);
            });
            
            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-plan').forEach(button => {
                button.addEventListener('click', function() {
                    const planId = this.getAttribute('data-id');
                    editStudyPlan(planId);
                });
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-plan').forEach(button => {
                button.addEventListener('click', function() {
                    const planId = this.getAttribute('data-id');
                    deleteStudyPlan(planId);
                });
            });
        }
    }
}

function setupFormHandlers() {
    // Task form
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('task-title').value;
            const subject = document.getElementById('task-subject').value;
            const type = document.getElementById('task-type').value;
            const dueDate = document.getElementById('task-due-date').value;
            const priority = document.getElementById('task-priority').value;
            const notes = document.getElementById('task-notes').value;
            
            const newTask = {
                id: Date.now().toString(),
                title,
                subject,
                type,
                dueDate,
                priority,
                notes,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            tasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            alert('Tarefa adicionada com sucesso!');
            taskForm.reset();
            loadTasks();
        });
    }
    
    // Grade form
    const gradeForm = document.getElementById('grade-form');
    if (gradeForm) {
        gradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('grade-subject').value;
            const type = document.getElementById('grade-type').value;
            const date = document.getElementById('grade-date').value;
            const description = document.getElementById('grade-description').value;
            const value = parseFloat(document.getElementById('grade-value').value);
            
            const newGrade = {
                id: Date.now().toString(),
                subject,
                type,
                date,
                description,
                value,
                createdAt: new Date().toISOString()
            };
            
            let grades = JSON.parse(localStorage.getItem('grades')) || [];
            grades.push(newGrade);
            localStorage.setItem('grades', JSON.stringify(grades));
            
            alert('Nota adicionada com sucesso!');
            gradeForm.reset();
            loadGrades();
        });
    }
    
    // Edit grade form
    const editGradeForm = document.getElementById('edit-grade-form');
    if (editGradeForm) {
        editGradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const gradeId = document.getElementById('edit-grade-id').value;
            const subject = document.getElementById('edit-grade-subject').value;
            const type = document.getElementById('edit-grade-type').value;
            const date = document.getElementById('edit-grade-date').value;
            const description = document.getElementById('edit-grade-description').value;
            const value = parseFloat(document.getElementById('edit-grade-value').value);
            
            let grades = JSON.parse(localStorage.getItem('grades')) || [];
            grades = grades.map(grade => {
                if (grade.id === gradeId) {
                    return {
                        ...grade,
                        subject,
                        type,
                        date,
                        description,
                        value
                    };
                }
                return grade;
            });
            
            localStorage.setItem('grades', JSON.stringify(grades));
            
            alert('Nota atualizada com sucesso!');
            closeModal('grade-edit-modal');
            loadGrades();
        });
    }
    
    // Cancel edit grade button
    const cancelEditGrade = document.getElementById('cancel-edit-grade');
    if (cancelEditGrade) {
        cancelEditGrade.addEventListener('click', function() {
            closeModal('grade-edit-modal');
        });
    }
    
    // Study plan form
    const studyPlanForm = document.getElementById('study-plan-form');
    if (studyPlanForm) {
        studyPlanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const subject = document.getElementById('plan-subject').value;
            const topic = document.getElementById('plan-topic').value;
            const targetDate = document.getElementById('plan-date').value;
            const hours = parseFloat(document.getElementById('plan-hours').value);
            const notes = document.getElementById('plan-notes').value;
            
            const newPlan = {
                id: Date.now().toString(),
                subject,
                topic,
                targetDate,
                hours,
                notes,
                progress: 0,
                createdAt: new Date().toISOString()
            };
            
            let studyPlans = JSON.parse(localStorage.getItem('studyPlans')) || [];
            studyPlans.push(newPlan);
            localStorage.setItem('studyPlans', JSON.stringify(studyPlans));
            
            alert('Plano de estudo criado com sucesso!');
            studyPlanForm.reset();
            loadStudyPlans();
        });
    }
    
    // Calendar view toggle
    const viewCalendarBtn = document.getElementById('view-calendar-btn');
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('tasks-list').style.display = 'none';
            document.getElementById('calendar-view').style.display = 'block';
        });
    }
    
    const viewListBtn = document.getElementById('view-list-btn');
    if (viewListBtn) {
        viewListBtn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('tasks-list').style.display = 'block';
            document.getElementById('calendar-view').style.display = 'none';
        });
    }
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Add task button in dashboard
    const addTaskBtnDashboard = document.getElementById('add-task-btn');
    if (addTaskBtnDashboard) {
        addTaskBtnDashboard.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('nav a[data-page="tasks"]').click();
        });
    }
    
    // Add grade button in dashboard
    const addGradeBtnDashboard = document.getElementById('add-grade-btn');
    if (addGradeBtnDashboard) {
        addGradeBtnDashboard.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('nav a[data-page="grades"]').click();
        });
    }
    
    // Add study plan button in dashboard
    const addStudyPlanBtnDashboard = document.getElementById('add-study-plan-btn');
    if (addStudyPlanBtnDashboard) {
        addStudyPlanBtnDashboard.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('nav a[data-page="study-plan"]').click();
        });
    }
    
    // Add material button in subjects
    const addMaterialBtn = document.getElementById('add-material-btn');
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Implement material addition functionality
            alert('Funcionalidade de adicionar material será implementada aqui');
        });
    }
    
    // Navigation buttons for holiday calendar
    document.getElementById('prev-month')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month')?.addEventListener('click', () => changeMonth(1));
}

function toggleTaskCompletion(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    loadTasks();
}

function editTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        // Fill the form with task data
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-subject').value = task.subject;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-due-date').value = task.dueDate;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-notes').value = task.notes || '';
        
        // Navigate to tasks page
        document.querySelector('nav a[data-page="tasks"]').click();
        
        // Scroll to form
        document.getElementById('task-form').scrollIntoView({ behavior: 'smooth' });
        
        // Remove the old task
        tasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function deleteTask(taskId) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(tasks));
        loadTasks();
    }
}

function editGrade(gradeId) {
    let grades = JSON.parse(localStorage.getItem('grades')) || [];
    const grade = grades.find(g => g.id === gradeId);
    
    if (grade) {
        document.getElementById('edit-grade-id').value = grade.id;
        document.getElementById('edit-grade-subject').value = grade.subject;
        document.getElementById('edit-grade-type').value = grade.type;
        document.getElementById('edit-grade-date').value = grade.date;
        document.getElementById('edit-grade-description').value = grade.description || '';
        document.getElementById('edit-grade-value').value = grade.value;
        
        openModal('grade-edit-modal');
    }
}

function deleteGrade(gradeId) {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
        let grades = JSON.parse(localStorage.getItem('grades')) || [];
        grades = grades.filter(grade => grade.id !== gradeId);
        localStorage.setItem('grades', JSON.stringify(grades));
        loadGrades();
    }
}

function editStudyPlan(planId) {
    let studyPlans = JSON.parse(localStorage.getItem('studyPlans')) || [];
    const plan = studyPlans.find(p => p.id === planId);
    
    if (plan) {
        // Fill the form with plan data
        document.getElementById('plan-subject').value = plan.subject;
        document.getElementById('plan-topic').value = plan.topic;
        document.getElementById('plan-date').value = plan.targetDate;
        document.getElementById('plan-hours').value = plan.hours;
        document.getElementById('plan-notes').value = plan.notes || '';
        
        // Navigate to study plan page
        document.querySelector('nav a[data-page="study-plan"]').click();
        
        // Scroll to form
        document.getElementById('study-plan-form').scrollIntoView({ behavior: 'smooth' });
        
        // Remove the old plan
        studyPlans = studyPlans.filter(p => p.id !== planId);
        localStorage.setItem('studyPlans', JSON.stringify(studyPlans));
    }
}

function deleteStudyPlan(planId) {
    if (confirm('Tem certeza que deseja excluir este plano de estudo?')) {
        let studyPlans = JSON.parse(localStorage.getItem('studyPlans')) || [];
        studyPlans = studyPlans.filter(plan => plan.id !== planId);
        localStorage.setItem('studyPlans', JSON.stringify(studyPlans));
        loadStudyPlans();
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateCalendarView() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const calendarBody = document.getElementById('calendar-body');
    
    if (calendarBody) {
        // For demo purposes, we'll show a static calendar
        // In a real app, this would generate based on current month
        calendarBody.innerHTML = `
            <tr>
                <td>1</td>
                <td class="today">2
                    <span class="event">Prova de Química</span>
                    <span class="event">Tarefa de Matemática</span>
                </td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
                <td>7</td>
            </tr>
            <tr>
                <td>8</td>
                <td>9</td>
                <td>10</td>
                <td>11</td>
                <td>12</td>
                <td>13</td>
                <td>14</td>
            </tr>
            <tr>
                <td>15</td>
                <td>16</td>
                <td>17</td>
                <td>18</td>
                <td>19</td>
                <td>20</td>
                <td>21</td>
            </tr>
            <tr>
                <td>22</td>
                <td>23</td>
                <td>24</td>
                <td>25</td>
                <td>26</td>
                <td>27</td>
                <td>28</td>
            </tr>
            <tr>
                <td>29</td>
                <td>30</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `;
    }
}

// Helper functions
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function formatSubjectName(subject) {
    const subjects = {
        'matematica': 'Matemática',
        'portugues': 'Português',
        'ingles': 'Inglês',
        'espanhol': 'Espanhol',
        'artes': 'Artes',
        'filosofia': 'Filosofia',
        'sociologia': 'Sociologia',
        'educacao_fisica': 'Educação Física',
        'quimica': 'Química',
        'fisica': 'Física',
        'biologia': 'Biologia',
        'historia': 'História',
        'geografia': 'Geografia'
    };
    return subjects[subject] || subject;
}

function getPriorityClass(priority) {
    const classes = {
        'alta': 'badge-danger',
        'media': 'badge-warning',
        'baixa': 'badge-success'
    };
    return classes[priority] || 'badge-secondary';
}

// ==== SINCRONIZAÇÃO COM FIREBASE (VERSÃO CORRETA) ====

function startFirebaseSync() {
    // Sincroniza imediatamente ao carregar
    syncWithFirebase();

    // Sincroniza a cada 30 segundos
    setInterval(syncWithFirebase, 30000);

    // Sincroniza ao fechar a página
    window.addEventListener('beforeunload', syncWithFirebase);
}

async function syncWithFirebase() {
    try {
        const success = await saveAllData();
        if (success) {
            console.log("Dados sincronizados com Firebase");
        } else {
            console.warn("Falha na sincronização com Firebase");
        }
    } catch (error) {
        console.error("Erro na sincronização:", error);
    }
}

function checkAndLoadSampleData() {
    // Esta função pode ser usada para carregar dados de exemplo se o localStorage estiver vazio
    // Implemente conforme necessário
}