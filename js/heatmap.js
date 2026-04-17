class Heatmap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // 锁定赛程时间范围 2026-04-16 到 2026-07-15
        this.startDate = new Date('2026-04-16T00:00:00');
        this.endDate = new Date('2026-07-15T23:59:59');
    }

    render(records, currentMember) {
        if (!this.container) return;
        this.container.innerHTML = '';
        
        // 过滤当前成员数据，并按日期聚合时长
        const memberRecords = records.filter(r => r.member === currentMember);
        const recordMap = {};
        memberRecords.forEach(r => {
            if(!recordMap[r.date]) recordMap[r.date] = 0;
            recordMap[r.date] += parseFloat(r.duration);
        });

        const grid = document.createElement('div');
        // 增大格子，使其看起来更高级，类似 GitHub 却更舒展
        grid.className = 'flex gap-[5px] overflow-x-auto custom-scrollbar pb-4 pt-4 px-2';

        let currDate = new Date(this.startDate);
        let currentColumn = document.createElement('div');
        currentColumn.className = 'flex flex-col gap-[5px]';
        
        // 处理起点的星期偏移 (假设周日为0)
        let startDay = currDate.getDay();
        for(let i = 0; i < startDay; i++) {
             const emptyCell = document.createElement('div');
             emptyCell.className = 'w-[16px] h-[16px] rounded-[4px] bg-transparent';
             currentColumn.appendChild(emptyCell);
        }

        while (currDate <= this.endDate) {
            const dateStr = `${currDate.getFullYear()}-${String(currDate.getMonth()+1).padStart(2,'0')}-${String(currDate.getDate()).padStart(2,'0')}`;
            const duration = recordMap[dateStr] || 0;
            
            const cell = document.createElement('div');
            // 添加基础边框，使其在暗黑模式下也界限分明
            cell.className = `w-[16px] h-[16px] rounded-[4px] transition-all duration-300 cursor-pointer relative group border border-black/5 dark:border-white/5 ${this.getColorClass(duration)}`;
            
            // 高级 Hover Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2.5 hidden group-hover:flex flex-col items-center bg-gray-900/95 backdrop-blur-md text-white text-xs rounded-xl py-2 px-3.5 whitespace-nowrap z-20 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0';
            
            if (duration > 0) {
                tooltip.innerHTML = `<span class="font-bold text-[13px] mb-0.5">${dateStr}</span><span class="text-apple-cyan/90 font-medium">专注 ${duration} 小时</span>`;
            } else {
                tooltip.innerHTML = `<span class="font-bold text-[13px] mb-0.5">${dateStr}</span><span class="text-gray-400">尚未记录</span>`;
            }
            
            const arrow = document.createElement('div');
            arrow.className = 'absolute top-full left-1/2 transform -translate-x-1/2 border-[5px] border-transparent border-t-gray-900/95';
            tooltip.appendChild(arrow);

            cell.appendChild(tooltip);
            currentColumn.appendChild(cell);

            if (currDate.getDay() === 6 || currDate.getTime() === this.endDate.getTime()) {
                grid.appendChild(currentColumn);
                currentColumn = document.createElement('div');
                currentColumn.className = 'flex flex-col gap-[5px]';
            }

            currDate.setDate(currDate.getDate() + 1);
        }
        
        this.container.appendChild(grid);
    }

    getColorClass(duration) {
        if (duration === 0) return 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700';
        if (duration <= 2) return 'bg-apple-cyan/30 hover:bg-apple-cyan/40 dark:bg-apple-cyan/40 dark:hover:bg-apple-cyan/50';
        if (duration <= 4) return 'bg-apple-cyan/60 hover:bg-apple-cyan/70 dark:bg-apple-cyan/70 dark:hover:bg-apple-cyan/80';
        if (duration <= 6) return 'bg-apple-cyan/90 hover:bg-apple-cyan dark:bg-apple-cyan dark:hover:bg-apple-cyan shadow-[0_0_10px_rgba(0,196,180,0.3)]';
        return 'bg-apple-blue hover:bg-blue-600 shadow-[0_0_12px_rgba(0,122,255,0.4)]'; // 超级爆肝颜色
    }
}