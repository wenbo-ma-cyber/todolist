document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    App.init();
});

const App = {
    data: null,
    heatmap: null,
    trendChartInst: null,
    topicChartInst: null,
    selectedTopics: new Set(),
    modalState: {
        isOpen: false,
        prefillDate: null // 用于进度表格点击补打卡
    },

    init() {
        this.data = DataStore.load();
        this.heatmap = new Heatmap('heatmapContainer');
        
        this.initDarkMode();
        this.initTabs();
        this.initMemberSelect();
        this.initModal();
        this.bindEvents();
        
        this.updateAllViews();
    },

    bindEvents() {
        // 暗黑模式
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.data.darkMode = !this.data.darkMode;
            this.applyDarkMode();
            DataStore.save(this.data);
            this.renderCharts(); 
        });

        // 成员切换
        document.getElementById('memberSelect').addEventListener('change', (e) => {
            this.data.currentMember = e.target.value;
            DataStore.save(this.data);
            this.updateAllViews();
        });

        // 数据备份
        document.getElementById('exportBtn').addEventListener('click', () => DataStore.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
        document.getElementById('importInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if(DataStore.importData(event.target.result)) {
                    alert('数据恢复成功！');
                    this.data = DataStore.load();
                    this.updateAllViews();
                } else {
                    alert('导入失败，请检查文件格式。');
                }
            };
            reader.readAsText(file);
        });

        // 打卡入口
        document.getElementById('fabCheckin').addEventListener('click', () => this.openModal());
        document.getElementById('openCheckinModalBtn').addEventListener('click', () => this.openModal());
    },

    updateAllViews() {
        this.renderDashboardStats();
        this.heatmap.render(this.data.records, this.data.currentMember);
        this.renderProgressTable();
        this.renderTimeline();
        this.renderCharts();
    },

    /* ================= Modal & Form Logic ================= */
    initModal() {
        const modal = document.getElementById('checkinModal');
        const backdrop = document.getElementById('modalBackdrop');
        const content = document.getElementById('modalContent');
        const closeBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelModalBtn');

        const closeModal = () => {
            backdrop.classList.remove('opacity-100');
            backdrop.classList.add('opacity-0');
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                this.modalState.isOpen = false;
            }, 300);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        this.closeModal = closeModal; // Export

        // Range Slider Logic
        const slider = document.getElementById('checkinDuration');
        const display = document.getElementById('durationDisplay');
        slider.addEventListener('input', (e) => {
            display.textContent = parseFloat(e.target.value).toFixed(1);
        });

        // Emoji Logic
        const emojis = document.querySelectorAll('.emoji-btn');
        const hiddenEmoji = document.getElementById('checkinEmoji');
        emojis[0].classList.add('active'); // default
        emojis.forEach(btn => {
            btn.addEventListener('click', () => {
                emojis.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                hiddenEmoji.value = btn.getAttribute('data-emoji');
            });
        });

        // Topic Custom Input Logic (Enter to add)
        document.getElementById('checkinCustomTopic').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const val = e.target.value.trim();
                if (val) {
                    DataStore.addCustomTopic(val);
                    this.data = DataStore.load(); // reload topics
                    this.renderTopicTags();
                    this.selectedTopics.add(val); // auto select
                    this.updateTopicTagUI();
                    e.target.value = '';
                }
            }
        });

        // Form Submit
        document.getElementById('checkinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            if(this.selectedTopics.size === 0) {
                alert('请至少选择一个学习模块！');
                return;
            }

            const record = {
                member: this.data.currentMember,
                date: document.getElementById('checkinDate').value,
                duration: parseFloat(document.getElementById('checkinDuration').value),
                topics: Array.from(this.selectedTopics),
                notes: document.getElementById('checkinNotes').value.trim(),
                emoji: hiddenEmoji.value
            };

            DataStore.addRecord(record);
            this.data = DataStore.load(); 
            
            this.updateAllViews();
            this.closeModal();
            
            // Simple notification
            setTimeout(() => alert('🎉 进度已记录，继续保持！'), 300);
        });
    },

    openModal(prefillDate = null) {
        this.renderTopicTags(); // refresh tags
        
        // Reset form
        this.selectedTopics.clear();
        this.updateTopicTagUI();
        document.getElementById('checkinNotes').value = '';
        document.getElementById('checkinDuration').value = 2;
        document.getElementById('durationDisplay').textContent = '2.0';
        
        // Date handling
        const dateInput = document.getElementById('checkinDate');
        if (prefillDate) {
            dateInput.value = prefillDate;
        } else {
            // Default to today in YYYY-MM-DD local time
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
            dateInput.value = localISOTime.split('T')[0];
        }

        const modal = document.getElementById('checkinModal');
        const backdrop = document.getElementById('modalBackdrop');
        const content = document.getElementById('modalContent');
        
        modal.classList.remove('hidden');
        // trigger reflow
        void modal.offsetWidth;
        
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
        
        this.modalState.isOpen = true;
    },

    renderTopicTags() {
        const container = document.getElementById('topicTags');
        container.innerHTML = '';
        const allTopics = DataStore.getAllTopics();
        
        allTopics.forEach(topic => {
            const btn = document.createElement('div');
            btn.className = 'topic-tag';
            btn.textContent = topic;
            btn.dataset.topic = topic;
            
            btn.addEventListener('click', () => {
                if(this.selectedTopics.has(topic)) {
                    this.selectedTopics.delete(topic);
                } else {
                    this.selectedTopics.add(topic);
                }
                this.updateTopicTagUI();
            });
            container.appendChild(btn);
        });
        this.updateTopicTagUI();
    },

    updateTopicTagUI() {
        const container = document.getElementById('topicTags');
        Array.from(container.children).forEach(btn => {
            if(this.selectedTopics.has(btn.dataset.topic)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    /* ================= View Renders ================= */
    initDarkMode() {
        this.applyDarkMode();
    },

    applyDarkMode() {
        const html = document.documentElement;
        const icon = document.getElementById('darkIcon');
        if (this.data.darkMode) {
            html.classList.add('dark');
            icon.setAttribute('data-lucide', 'sun');
        } else {
            html.classList.remove('dark');
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    },

    initTabs() {
        const btns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.view-section');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                
                btns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`.nav-btn[data-target="${target}"]`).forEach(b => b.classList.add('active'));
                
                sections.forEach(sec => {
                    if(sec.id === target) {
                        sec.classList.remove('hidden');
                        void sec.offsetWidth; 
                        sec.classList.add('animate-fade-in');
                    } else {
                        sec.classList.add('hidden');
                        sec.classList.remove('animate-fade-in');
                    }
                });

                if(target === 'summary') this.renderCharts();
                if(target === 'progressTable') this.renderProgressTable();
            });
        });
    },

    initMemberSelect() {
        const select = document.getElementById('memberSelect');
        select.innerHTML = '';
        this.data.members.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if(m === this.data.currentMember) opt.selected = true;
            select.appendChild(opt);
        });
    },

    renderDashboardStats() {
        document.getElementById('welcomeName').textContent = this.data.currentMember.split(' ')[0]; // 短名字
        
        const records = this.data.records.filter(r => r.member === this.data.currentMember);
        
        const uniqueDays = new Set(records.map(r => r.date)).size;
        document.getElementById('statTotalDays').textContent = uniqueDays;

        const totalHours = records.reduce((sum, r) => sum + r.duration, 0);
        document.getElementById('statTotalHours').textContent = totalHours.toFixed(1);

        // Streak Calc
        let streak = 0;
        const sortedDates = [...new Set(records.map(r => r.date))].sort((a,b) => new Date(b) - new Date(a));
        
        if (sortedDates.length > 0) {
            const tzoffset = (new Date()).getTimezoneOffset() * 60000;
            const today = new Date(Date.now() - tzoffset);
            const todayStr = today.toISOString().split('T')[0];
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let curr = new Date(sortedDates[0]);
            if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
                streak = 1;
                for (let i = 1; i < sortedDates.length; i++) {
                    const prev = new Date(sortedDates[i]);
                    const diffTime = Math.abs(curr - prev);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                    if (diffDays === 1) {
                        streak++;
                        curr = prev;
                    } else {
                        break;
                    }
                }
            }
        }
        document.getElementById('statStreak').textContent = streak;
    },

    // 新增：渲染 2D 进度表格 (Table Habit Style)
    renderProgressTable() {
        if(document.getElementById('progressTable').classList.contains('hidden')) return;

        const thead = document.getElementById('ptableHead');
        const tbody = document.getElementById('ptableBody');
        
        const records = this.data.records.filter(r => r.member === this.data.currentMember);
        const allTopics = DataStore.getAllTopics();
        
        // 生成最近30天的日期 (列)
        const dates = [];
        const today = new Date();
        for(let i=29; i>=0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const tzoffset = d.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().split('T')[0];
            dates.push(localISOTime);
        }

        // 渲染表头
        let headHtml = '<tr><th class="px-4 py-3 font-semibold w-40 sticky left-0 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-md z-20 shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)]">学习模块</th>';
        dates.forEach(d => {
            const shortDate = d.slice(5).replace('-','/'); // MM/DD
            const isToday = d === dates[dates.length-1];
            headHtml += `<th class="px-2 py-3 text-center font-medium min-w-[40px] ${isToday ? 'text-apple-blue font-bold' : ''}">${shortDate}</th>`;
        });
        headHtml += '</tr>';
        thead.innerHTML = headHtml;

        // 渲染表体 (行: 模块, 列: 日期)
        tbody.innerHTML = '';
        allTopics.forEach(topic => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors';
            
            // 模块名称列 (固定在左侧)
            const tdName = document.createElement('td');
            tdName.className = 'px-4 py-3 font-medium text-apple-textLight dark:text-apple-textDark sticky left-0 bg-white/95 dark:bg-apple-cardDark/95 backdrop-blur-md z-10 shadow-[1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[1px_0_0_rgba(255,255,255,0.05)] truncate max-w-[160px]';
            tdName.title = topic;
            tdName.textContent = topic;
            tr.appendChild(tdName);

            // 日期网格
            dates.forEach(date => {
                const td = document.createElement('td');
                td.className = 'p-1 text-center';
                
                // 计算该日期下，该模块的总时长
                const dayRecords = records.filter(r => r.date === date && r.topics.includes(topic));
                const duration = dayRecords.reduce((sum, r) => sum + r.duration, 0);

                const cellDiv = document.createElement('div');
                cellDiv.className = 'w-full h-8 mx-auto flex items-center justify-center ptable-cell ' + this.getTableColorClass(duration);
                
                if (duration > 0) {
                    cellDiv.innerHTML = `<span class="text-[10px] font-medium text-white/90 drop-shadow-md">${duration}h</span>`;
                    cellDiv.title = `${date} ${topic}: ${duration}小时`;
                } else {
                    cellDiv.title = `点击补打卡 ${date} ${topic}`;
                }

                // 点击快速补打卡
                cellDiv.addEventListener('click', () => {
                    this.openModal(date);
                    // Optional: pre-select topic in modal
                    setTimeout(() => {
                        this.selectedTopics.clear();
                        this.selectedTopics.add(topic);
                        this.updateTopicTagUI();
                    }, 50);
                });

                td.appendChild(cellDiv);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    },

    getTableColorClass(duration) {
        if (duration === 0) return 'bg-gray-100/50 dark:bg-gray-800/50';
        if (duration <= 1) return 'bg-apple-purple/30 dark:bg-apple-purple/40';
        if (duration <= 3) return 'bg-apple-purple/60 dark:bg-apple-purple/70';
        if (duration <= 5) return 'bg-apple-purple/90 dark:bg-apple-purple';
        return 'bg-[#5E5CE6] shadow-[0_0_8px_rgba(94,92,230,0.4)]'; // Apple Indigo
    },

    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        container.innerHTML = '';
        
        const records = this.data.records
            .filter(r => r.member === this.data.currentMember)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if(records.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full opacity-50">
                    <i data-lucide="inbox" class="w-12 h-12 mb-3"></i>
                    <p>暂无打卡记录</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        records.forEach(r => {
            const card = document.createElement('div');
            card.className = 'relative pl-6 pb-6 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 last:pb-0 group';
            
            // Timeline dot
            const dot = document.createElement('div');
            dot.className = 'absolute -left-[9px] top-1 w-4 h-4 bg-apple-blue rounded-full border-4 border-white dark:border-apple-cardDark group-hover:scale-125 transition-transform duration-300';
            card.appendChild(dot);

            let html = `
                <div class="bg-gray-50/80 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-lg tracking-tight">${r.date}</span>
                            <span class="text-2xl filter drop-shadow-sm" title="状态">${r.emoji}</span>
                        </div>
                        <span class="text-sm font-bold text-apple-cyan bg-apple-cyan/10 px-2.5 py-1 rounded-lg">${r.duration} h</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${r.topics.map(t => `<span class="text-xs font-medium text-apple-purple bg-apple-purple/10 border border-apple-purple/20 px-2.5 py-1 rounded-md">${t}</span>`).join('')}
                    </div>
            `;
            
            if(r.notes) {
                const parsedNotes = typeof marked !== 'undefined' ? marked.parse(r.notes) : r.notes;
                html += `<div class="text-sm text-apple-textMuted prose prose-sm dark:prose-invert leading-relaxed max-w-none mt-2 bg-white/50 dark:bg-black/20 p-3 rounded-xl">${parsedNotes}</div>`;
            }

            html += `
                    <div class="mt-3 flex justify-end">
                        <button class="text-xs text-red-400 hover:text-red-500 font-medium transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1" onclick="App.deleteRecord('${r.id}')"><i data-lucide="trash-2" class="w-3 h-3"></i>删除</button>
                    </div>
                </div>
            `;
            
            card.innerHTML += html;
            container.appendChild(card);
        });
        lucide.createIcons();
    },

    deleteRecord(id) {
        if(confirm('确定要删除这条记录吗？')) {
            DataStore.deleteRecord(id);
            this.data = DataStore.load();
            this.updateAllViews();
        }
    },

    renderCharts() {
        if(document.getElementById('summary').classList.contains('hidden')) return;

        const records = this.data.records.filter(r => r.member === this.data.currentMember);
        
        // Bar Chart Data (Last 14 days)
        const last14Days = [];
        const trendData = [];
        for(let i=13; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const tzoffset = d.getTimezoneOffset() * 60000;
            const dateStr = (new Date(d.getTime() - tzoffset)).toISOString().split('T')[0];
            last14Days.push(dateStr.slice(5)); 
            
            const dayRecords = records.filter(r => r.date === dateStr);
            const sum = dayRecords.reduce((acc, r) => acc + r.duration, 0);
            trendData.push(sum);
        }

        // Doughnut Chart Data (Subject Analytics)
        const topicCounts = {};
        records.forEach(r => {
            r.topics.forEach(t => {
                // Weight by duration? For simplicity, count frequency or total duration. Let's use duration.
                topicCounts[t] = (topicCounts[t] || 0) + (r.duration / r.topics.length);
            });
        });
        const topicLabels = Object.keys(topicCounts);
        // Round to 1 decimal
        const topicData = Object.values(topicCounts).map(v => parseFloat(v.toFixed(1)));

        const textColor = this.data.darkMode ? '#86868B' : '#86868B';
        const gridColor = this.data.darkMode ? '#38383A' : '#E5E5EA';

        if(this.trendChartInst) this.trendChartInst.destroy();
        if(this.topicChartInst) this.topicChartInst.destroy();

        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

        // Trend Chart (Bar)
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        // Gradient for bars
        const gradient = ctxTrend.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#007AFF');
        gradient.addColorStop(1, '#00C4B4');

        this.trendChartInst = new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: last14Days,
                datasets: [{
                    label: '专注时长 (小时)',
                    data: trendData,
                    backgroundColor: gradient,
                    borderRadius: 6,
                    borderSkipped: false,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: this.data.darkMode ? 'rgba(28,28,30,0.9)' : 'rgba(255,255,255,0.9)',
                        titleColor: this.data.darkMode ? '#fff' : '#000',
                        bodyColor: this.data.darkMode ? '#fff' : '#000',
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4,
                        cornerRadius: 8,
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: gridColor, drawBorder: false }, 
                        ticks: { color: textColor, padding: 10 } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: textColor, maxRotation: 45, minRotation: 0 } 
                    }
                },
                animation: {
                    y: { duration: 1000, easing: 'easeOutQuart' }
                }
            }
        });

        // Topic Chart (Doughnut)
        const ctxTopic = document.getElementById('topicChart').getContext('2d');
        this.topicChartInst = new Chart(ctxTopic, {
            type: 'doughnut',
            data: {
                labels: topicLabels,
                datasets: [{
                    data: topicData,
                    backgroundColor: [
                        '#007AFF', // Blue
                        '#8E7AFF', // Purple
                        '#00C4B4', // Cyan
                        '#FF9500', // Orange
                        '#34C759', // Green
                        '#FF3B30', // Red
                        '#5AC8FA', // Light Blue
                        '#FF2D55'  // Pink
                    ],
                    borderWidth: 2,
                    borderColor: this.data.darkMode ? '#1C1C1E' : '#FFFFFF',
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'right', 
                        labels: { 
                            color: textColor, 
                            padding: 15, 
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                        } 
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw} 小时`;
                            }
                        }
                    }
                },
                cutout: '75%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }
};