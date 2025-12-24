'use client';

import styles from './Create.module.css';
import Chat_Create from './chat/Chat_Create';
import Content_Create from './content/Content_Create';

/**
 * Create 页面主组件
 * 左侧为聊天区域，右侧为内容展示区域
 */
export default function Create() {
    return (
        <div className={styles.create}>
            {/* 聊天区域组件 */}
            <div className={styles.chat_area}>
                <Chat_Create />
            </div>
            {/* 内容区域组件 */}
            <div className={styles.content_area}>
                <Content_Create />
            </div>
        </div>
    );
}
