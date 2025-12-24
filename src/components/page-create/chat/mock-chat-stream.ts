/**
 * 模拟聊天流相关的类型和函数
 */

// 消息类型枚举
export type MessageType = 'text' | 'tag' | 'description' | 'step';

// 步骤状态
export type StepStatus = 'pending' | 'completed' | 'in_progress';

// 步骤项
export interface StepItem {
    id: string;
    title: string;
    description?: string;
    status: StepStatus;
}

// 标签项
export interface TagItem {
    id: string;
    label: string;
    variant?: 'default' | 'primary' | 'secondary';
}

// 聊天消息
export interface ChatMessage {
    id: string;
    type: MessageType;
    content: string;
    tags?: TagItem[];
    steps?: StepItem[];
    timestamp: number;
}

// AI 助手信息
export interface AssistantInfo {
    name: string;
    avatar: string;
    role: string;
}

// 模拟的助手信息
export const mockAssistant: AssistantInfo = {
    name: 'Art Director',
    avatar: '/avatars/art-director.png',
    role: 'designer',
};

// 模拟的初始消息
const mockMessages: ChatMessage[] = [
    {
        id: '1',
        type: 'text',
        content: "Hey Director @Username!\n\nYour Art Director is here! I'm online 24/7, standing by for you. I'm your Designer. Be sure to explore our Style Library and enjoy all the surprises I have waiting for you!",
        timestamp: Date.now() - 10000,
    },
    {
        id: '2',
        type: 'text',
        content: "I'm now going to build out the a professional profile for your character!",
        timestamp: Date.now() - 8000,
    },
    {
        id: '3',
        type: 'tag',
        content: 'If you have the',
        tags: [
            { id: 't1', label: 'Video-Hailuo02', variant: 'primary' },
        ],
        timestamp: Date.now() - 6000,
    },
    {
        id: '4',
        type: 'description',
        content: 'The camera shoots from a high altitude, capturing the black dragon coiled on the top of the castle. The camera shoots from a high altitude, capturing the black dragon',
        timestamp: Date.now() - 4000,
    },
    {
        id: '5',
        type: 'step',
        content: '',
        steps: [
            {
                id: 's1',
                title: 'Acquire',
                description: 'Main Process of Music Video Creation',
                status: 'completed',
            },
            {
                id: 's2',
                title: 'Confirm',
                description: 'Music Video Production Process Critical information',
                status: 'completed',
            },
            {
                id: 's3',
                title: 'Search',
                description: 'Script writing Knowledge',
                status: 'completed',
            },
        ],
        timestamp: Date.now() - 2000,
    },
    {
        id: '6',
        type: 'text',
        content: "I'm now going to build out the a",
        timestamp: Date.now() - 1000,
    },
];

/**
 * 模拟流式获取聊天消息
 * @param onMessage 每条消息的回调
 * @param onComplete 完成时的回调
 */
export async function mockFetchChatStream(
    onMessage: (message: ChatMessage) => void,
    onComplete?: () => void
): Promise<void> {
    // 模拟逐条消息的延迟发送
    for (const message of mockMessages) {
        await delay(500);
        onMessage(message);
    }
    onComplete?.();
}

/**
 * 模拟流式文本输出（逐字符）
 * @param text 要输出的文本
 * @param onChar 每个字符的回调
 * @param speed 每个字符的延迟（毫秒）
 */
export async function mockStreamText(
    text: string,
    onChar: (char: string, fullText: string) => void,
    speed: number = 30
): Promise<void> {
    let result = '';
    for (const char of text) {
        await delay(speed);
        result += char;
        onChar(char, result);
    }
}

/**
 * 模拟发送消息并获取 AI 响应
 * @param userMessage 用户消息
 * @param onResponse 响应回调（流式）
 */
export async function mockSendMessage(
    userMessage: string,
    onResponse: (text: string) => void,
    onComplete?: () => void
): Promise<void> {
    // 模拟 AI 响应
    const responses = [
        "Let your imagination run wild and start animating!",
        "I'm analyzing your request and preparing the creative assets...",
        "Great choice! I'll help you create something amazing.",
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];

    // 模拟流式输出
    await mockStreamText(response, (_, fullText) => {
        onResponse(fullText);
    });

    onComplete?.();
}

// 延迟工具函数
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

