const STORAGE_KEY = 'ti_design_2026_data';

const defaultTopics = ['STM32基础', '定时器/PWM', 'ADC/DAC', 'PID位置环', 'PID速度环', '电机驱动', '传感器调理', '硬件焊接', '历年真题'];

const defaultData = {
    members: ['队长 (我)', '硬件担当', '算法担当'],
    currentMember: '队长 (我)',
    records: [], 
    darkMode: false
};

class DataStore {
    static load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? { ...defaultData, ...JSON.parse(data) } : defaultData;
        } catch (e) {
            console.error("加载数据失败", e);
            return defaultData;
        }
    }

    static save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    static addRecord(record) {
        const data = this.load();
        record.id = Date.now().toString();
        // 如果同一天同一个成员已经打卡，则累加时长，合并笔记 (根据需求可改为替换或允许复数，这里采用允许复数次打卡)
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
        a.download = `TI电赛备赛数据备份_${new Date().toISOString().split('T')[0]}.json`;
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