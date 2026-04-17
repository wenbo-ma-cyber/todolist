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

    init() {
        this.data = DataStore.load();
        this.heatmap = new Heatmap('heatmapContainer');
        
        this.initDarkMode();
        this.initTabs();
        this.initMemberSelect();
        this.initCheckinForm();
        this.bindEvents();
        
        // 设置今日日期为默认
        document.getElementById('checkinDate').valueAsDate = new Date();
        
        this.updateAllViews();
    },

    bindEvents() {
        // 暗黑模式切换
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.data.darkMode = !this.data.darkMode;
            this.applyDarkMode();
            DataStore.save(this.data);
            this.renderCharts(); // 重新渲染图表颜色
        });

        // 成员切换
        document.getElementById('memberSelect').addEventListener('change', (e) => {
            this.data.currentMember = e.target.value;
            DataStore.save(this.data);
            this.updateAllViews();
        });

        // 数据导出导入
        document.getElementById('exportBtn').addEventListener('click', () => DataStore.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
        document.getElementById('importInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if(DataStore.importData(event.target.result)) {
                    alert('数据导入成功！');
                    this.data = DataStore.load();
                    this.updateAllViews();
                } else {
                    alert('数据格式不正确');
                }
            };
            reader.readAsText(file);
        });
    },

    updateAllViews() {
        this.renderDashboardStats();
        this.heatmap.render(this.data.records, this.data.currentMember);
        this.renderTimeline();
        this.renderCharts();
    },

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
                
                // Update buttons
                btns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`.nav-btn[data-target="${target}"]`).forEach(b => b.classList.add('active'));
                
                // Update sections
                sections.forEach(sec => {
                    if(sec.id === target) {
                        sec.classList.remove('hidden');
                        // Trigger reflow for animation
                        void sec.offsetWidth; 
                        sec.classList.add('animate-fade-in');
                    } else {
                        sec.classList.add('hidden');
                        sec.classList.remove('animate-fade-in');
                    }
                });

                if(target === 'summary') this.renderCharts();
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
        document.getElementById('welcomeName').textContent = this.data.currentMember;
    },

    initCheckinForm() {
        // 渲染主题标签
        const container = document.getElementById('topicTags');
        defaultTopics.forEach(topic => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 hover:border-apple-blue dark:hover:border-apple-blue transition-colors';
            btn.textContent = topic;
            btn.addEventListener('click', () => {
                if(this.selectedTopics.has(topic)) {
                    this.selectedTopics.delete(topic);
                    btn.classList.remove('bg-apple-blue', 'text-white', 'border-apple-blue');
                } else {
                    this.selectedTopics.add(topic);
                    btn.classList.add('bg-apple-blue', 'text-white', 'border-apple-blue');
                }
            });
            container.appendChild(btn);
        });

        // Emoji 选择
        const emojis = document.querySelectorAll('.emoji-btn');
        const hiddenEmoji = document.getElementById('checkinEmoji');
        // 默认选中第一个
        emojis[0].classList.add('ring-2', 'ring-apple-blue');
        
        emojis.forEach(btn => {
            btn.addEventListener('click', () => {
                emojis.forEach(b => b.classList.remove('ring-2', 'ring-apple-blue'));
                btn.classList.add('ring-2', 'ring-apple-blue');
                hiddenEmoji.value = btn.getAttribute('data-emoji');
            });
        });

        // 提交表单
        document.getElementById('checkinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const customTopic = document.getElementById('checkinCustomTopic').value.trim();
            const finalTopics = Array.from(this.selectedTopics);
            if(customTopic) finalTopics.push(customTopic);

            const record = {
                member: this.data.currentMember,
                date: document.getElementById('checkinDate').value,
                duration: parseFloat(document.getElementById('checkinDuration').value),
                topics: finalTopics,
                notes: document.getElementById('checkinNotes').value.trim(),
                emoji: hiddenEmoji.value
            };

            DataStore.addRecord(record);
            this.data = DataStore.load(); // Reload
            
            // 提示与重置
            alert('🎉 打卡成功！继续保持！');
            document.getElementById('checkinNotes').value = '';
            document.getElementById('checkinCustomTopic').value = '';
            this.selectedTopics.clear();
            container.querySelectorAll('button').forEach(b => b.classList.remove('bg-apple-blue', 'text-white', 'border-apple-blue'));
            
            this.updateAllViews();
            
            // 切换回主页
            document.querySelector('.nav-btn[data-target="dashboard"]').click();
        });
    },

    renderDashboardStats() {
        document.getElementById('welcomeName').textContent = this.data.currentMember;
        
        const records = this.data.records.filter(r => r.member === this.data.currentMember);
        
        // 唯一打卡天数
        const uniqueDays = new Set(records.map(r => r.date)).size;
        document.getElementById('statTotalDays').textContent = uniqueDays;

        // 总时长
        const totalHours = records.reduce((sum, r) => sum + r.duration, 0);
        document.getElementById('statTotalHours').textContent = totalHours.toFixed(1);

        // 计算当前连续打卡 (Streak)
        let streak = 0;
        const sortedDates = [...new Set(records.map(r => r.date))].sort((a,b) => new Date(b) - new Date(a));
        
        if (sortedDates.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let curr = new Date(sortedDates[0]);
            // 如果最近一次打卡是今天或昨天，才算有连击
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

    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        container.innerHTML = '';
        
        const records = this.data.records
            .filter(r => r.member === this.data.currentMember)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if(records.length === 0) {
            container.innerHTML = '<p class="text-center text-apple-textMuted py-10">暂无打卡记录，快去完成第一次打卡吧！</p>';
            return;
        }

        records.forEach(r => {
            const card = document.createElement('div');
            card.className = 'relative pl-8 pb-6 border-l-2 border-gray-100 dark:border-gray-800 last:border-0 last:pb-0';
            
            // 节点圆圈
            const dot = document.createElement('div');
            dot.className = 'absolute -left-[9px] top-0 w-4 h-4 bg-apple-blue rounded-full border-4 border-white dark:border-[#1C1C1E]';
            card.appendChild(dot);

            // 内容
            let html = `
                <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="font-bold mr-2">${r.date}</span>
                            <span class="text-xl">${r.emoji}</span>
                        </div>
                        <span class="text-sm font-medium text-apple-cyan bg-apple-cyan/10 px-2 py-1 rounded-lg">${r.duration}h</span>
                    </div>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${r.topics.map(t => `<span class="text-xs text-apple-purple bg-apple-purple/10 px-2 py-1 rounded-md">${t}</span>`).join('')}
                    </div>
            `;
            
            if(r.notes) {
                // 简单的Markdown支持 (如果引入了marked)
                const parsedNotes = typeof marked !== 'undefined' ? marked.parse(r.notes) : r.notes;
                html += `<div class="text-sm text-apple-textMuted prose prose-sm dark:prose-invert leading-relaxed">${parsedNotes}</div>`;
            }

            html += `
                    <button class="mt-3 text-xs text-red-400 hover:text-red-500 transition-colors" onclick="App.deleteRecord('${r.id}')">删除记录</button>
                </div>
            `;
            
            card.innerHTML += html;
            container.appendChild(card);
        });
    },

    deleteRecord(id) {
        if(confirm('确定要删除这条打卡记录吗？不可恢复。')) {
            DataStore.deleteRecord(id);
            this.data = DataStore.load();
            this.updateAllViews();
        }
    },

    renderCharts() {
        if(document.getElementById('summary').classList.contains('hidden')) return;

        const records = this.data.records.filter(r => r.member === this.data.currentMember);
        
        // 准备趋势图数据 (最近14天)
        const last14Days = [];
        const trendData = [];
        for(let i=13; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            last14Days.push(dateStr.slice(5)); // MM-DD
            
            const dayRecords = records.filter(r => r.date === dateStr);
            const sum = dayRecords.reduce((acc, r) => acc + r.duration, 0);
            trendData.push(sum);
        }

        // 准备主题分布数据
        const topicCounts = {};
        records.forEach(r => {
            r.topics.forEach(t => {
                topicCounts[t] = (topicCounts[t] || 0) + 1;
            });
        });
        const topicLabels = Object.keys(topicCounts);
        const topicData = Object.values(topicCounts);

        const textColor = this.data.darkMode ? '#F5F5F7' : '#1D1D1F';
        const gridColor = this.data.darkMode ? '#333333' : '#E5E5EA';

        // 销毁旧实例
        if(this.trendChartInst) this.trendChartInst.destroy();
        if(this.topicChartInst) this.topicChartInst.destroy();

        // 渲染趋势图 (Bar)
        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        this.trendChartInst = new Chart(ctxTrend, {
            type: 'bar',
            data: {
                labels: last14Days,
                datasets: [{
                    label: '学习时长 (小时)',
                    data: trendData,
                    backgroundColor: '#007AFF',
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                }
            }
        });

        // 渲染分布图 (Doughnut)
        const ctxTopic = document.getElementById('topicChart').getContext('2d');
        this.topicChartInst = new Chart(ctxTopic, {
            type: 'doughnut',
            data: {
                labels: topicLabels,
                datasets: [{
                    data: topicData,
                    backgroundColor: ['#007AFF', '#00C4B4', '#34C759', '#FF9500', '#8E7AFF', '#FF3B30', '#5AC8FA'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 20, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    }
};