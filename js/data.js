const STORAGE_KEY = 'ti_design_2026_v2_data'; // 更换KEY避免旧数据结构冲突

// 预设学习模块 (借鉴 Study-Tracker)
const defaultTopics = [
    'STM32基础与外设', 
    'PID控制与调参', 
    '电机驱动与测速', 
    '传感器数据融合', 
    '控制系统架构设计', 
    '硬件电路焊接', 
    '历年真题实战',
    '技术报告撰写'
];

const defaultData = {
    members: ['队长 (我)', '硬件担当', '算法担当'],
    currentMember: '队长 (我)',
    records: [], 
    customTopics: [], // 用户自定义的主题
    darkMode: false
};

class DataStore {
    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // 兼容处理
                if(!parsed.customTopics) parsed.customTopics = [];
                return { ...defaultData, ...parsed };
            }
            return defaultData;
        } catch (e) {
            console.error("加载数据失败", e);
            return defaultData;
        }
    }

    static save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    static getAllTopics() {
        const data = this.load();
        return [...new Set([...defaultTopics, ...data.customTopics])];
    }

    static addCustomTopic(topic) {
        const data = this.load();
        if (topic && !defaultTopics.includes(topic) && !data.customTopics.includes(topic)) {
            data.customTopics.push(topic);
            this.save(data);
        }
    }

    static addRecord(record) {
        const data = this.load();
        record.id = Date.now().toString();
        // 允许同一天多次打卡，形成Timeline
        data.records.push(record);
        this.save(data);
    }

    static deleteRecord(id) {
        const data = this.load();
        data.records = data.records.filter(r => r.id !== id);
        this.save(data);
    }

    static exportData() {
        const data = localStorage.getItem(STORAGE_KEY);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TI电赛备赛数据_V2备份_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    static importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if(parsed && parsed.members && parsed.records) {
                this.save(parsed);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }
}