/**
 * 格式化时间详情工具函数
 * 一小时内显示xx mins
 * 12小时内显示xx hours
 * 今天/昨天显示Today,Yesterday
 * 一周内显示对应的周的英文
 * 一周以上使用具体时间如Feb 15th,2025
 * @param time 输入的时间字符串（UTC时间）
 * @returns 格式化后的时间字符串
 */
export function formatTimeDetail(time: string) {
    // 获取用户时区偏移（分钟）
    // const timezoneOffset = new Date().getTimezoneOffset()

    // 将UTC时间转换为本地时间
    const utcDate = new Date(time)
    const localDate = new Date(utcDate.getTime())

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // 计算时间差（毫秒）
    const diff = now.getTime() - localDate.getTime()

    // 未来时间：直接显示具体日期
    if (diff < -60000) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const day = localDate.getDate()
        const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3) ? 0 : day % 10]
        const year = utcDate.getUTCFullYear()
        return `${months[localDate.getMonth()]} ${day}${suffix}, ${year}`
    }

    // 1小时 = 3600000毫秒
    if (diff < 3600000) {
        // 小于1小时，显示分钟
        const minutes = Math.floor(diff / 60000)
        if ((minutes <= 1) && (minutes >= -1)) {
            return 'just now'
        }
        return `${minutes} min${minutes > 1 ? 's ago' : ' ago'}`
    } else if (diff < 43200000) { // 12小时 = 43200000毫秒
        // 小于12小时，显示小时
        const hours = Math.floor(diff / 3600000)
        return `${hours} hour${hours > 1 ? 's ago' : ' ago'}`
    } else {
        // 检查是否是今天
        if (localDate.getTime() >= today.getTime()) {
            return 'Today'
        }
        // 检查是否是昨天
        if (localDate.getTime() >= yesterday.getTime()) {
            return 'Yesterday'
        }
        // 检查是否在一周内
        const weekDiff = Math.floor((today.getTime() - localDate.getTime()) / (24 * 3600000))
        if (weekDiff < 7) {
            const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
            return weekdays[localDate.getDay()]
        }
        // 一周以上，显示具体日期
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const day = localDate.getDate()
        const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3) ? 0 : day % 10]
        const year = utcDate.getUTCFullYear()
        return `${months[localDate.getMonth()]} ${day}${suffix}, ${year}`
    }
}

/**
 * 格式化时间为具体日期
 * 显示具体的日期格式，如 "February 15th"
 * @param time 输入的时间字符串（UTC时间）
 * @returns 格式化后的日期字符串
 */
export function formatTimeToDay(time: string) {
    // 将UTC时间转换为本地时间
    const utcDate = new Date(time)
    const localDate = new Date(utcDate.getTime())
    
    // 完整月份名称数组
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    // 获取日期
    const day = localDate.getDate()
    
    // 日期后缀
    const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3) ? 0 : day % 10]
    
    // 获取月份
    const month = months[localDate.getMonth()]
    
    return `${month} ${day}${suffix}`
}

