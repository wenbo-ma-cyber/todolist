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
        grid.className = 'flex gap-1 overflow-x-auto custom-scrollbar pb-2 pt-6 px-1';

        let currDate = new Date(this.startDate);
        let currentColumn = document.createElement('div');
        currentColumn.className = 'flex flex-col gap-1';
        
        // 处理起点的星期偏移 (假设周日为0)
        let startDay = currDate.getDay();
        for(let i = 0; i < startDay; i++) {
             const emptyCell = document.createElement('div');
             emptyCell.className = 'w-[14px] h-[14px] rounded-[3px] bg-transparent';
             currentColumn.appendChild(emptyCell);
        }

        while (currDate <= this.endDate) {
            // 本地时间转 YYYY-MM-DD 防止时区问题
            const dateStr = `${currDate.getFullYear()}-${String(currDate.getMonth()+1).padStart(2,'0')}-${String(currDate.getDate()).padStart(2,'0')}`;
            const duration = recordMap[dateStr] || 0;
            
            const cell = document.createElement('div');
            cell.className = `w-[14px] h-[14px] rounded-[3px] transition-all duration-300 cursor-pointer relative group ${this.getColorClass(duration)}`;
            
            // Hover Tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 dark:bg-gray-100 text-white dark:text-black text-xs rounded-md py-1.5 px-3 whitespace-nowrap z-10 shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity';
            tooltip.innerText = duration > 0 ? `${dateStr} : 学习 ${duration} 小时` : `${dateStr} : 未打卡`;
            
            // 小三角形
            const arrow = document.createElement('div');
            arrow.className = 'absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-100';
            tooltip.appendChild(arrow);

            cell.appendChild(tooltip);
            currentColumn.appendChild(cell);

            if (currDate.getDay() === 6 || currDate.getTime() === this.endDate.getTime()) {
                grid.appendChild(currentColumn);
                currentColumn = document.createElement('div');
                currentColumn.className = 'flex flex-col gap-1';
            }

            currDate.setDate(currDate.getDate() + 1);
        }
        
        this.container.appendChild(grid);
    }

    getColorClass(duration) {
        if (duration === 0) return 'bg-gray-100 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700';
        if (duration <= 2) return 'bg-apple-cyan/40 hover:bg-apple-cyan/50';
        if (duration <= 4) return 'bg-apple-cyan/70 hover:bg-apple-cyan/80';
        return 'bg-apple-cyan shadow-[0_0_8px_rgba(0,196,180,0.4)]';
    }
}