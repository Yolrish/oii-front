'use client';

import * as React from 'react';

/**
 * CreateContext 的值类型
 * 根据需要扩展此类型
 */
type CreateContextProps = {
    // 当前步骤
    step: string;
    setStep: (step: string) => void;
};

/**
 * CreateContext 上下文
 * 用于在 Create 页面组件树中共享状态和方法
 */
const CreateContext = React.createContext<CreateContextProps | null>(null);

/**
 * useCreate Hook
 * 
 * 用于在 Create 页面子组件中获取上下文
 * 必须在 CreateProvider 组件内部使用，否则会抛出错误
 * 
 * @returns {CreateContextProps} Create 页面的上下文对象
 * @throws {Error} 当在 CreateProvider 外部使用时抛出错误
 */
export function useCreate(): CreateContextProps {
    const context = React.useContext(CreateContext);
    if (!context) {
        throw new Error('useCreate must be used within a CreateProvider');
    }
    return context;
}

/**
 * CreateProvider 组件的 Props
 */
type CreateProviderProps = {
    children: React.ReactNode;
    // 初始步骤，默认为 0
    initialStep?: string;
};

/**
 * CreateProvider 组件
 * 
 * 为 Create 页面提供状态管理上下文
 * 包含步骤控制、表单数据管理等功能
 */
export function CreateProvider({
    children,
    initialStep = 'init',
}: CreateProviderProps) {
    // 当前步骤状态
    const [step, setStep] = React.useState(initialStep);

    return <CreateContext.Provider value={{ step, setStep }}>
        {children}
    </CreateContext.Provider>;
}

export default CreateProvider;
