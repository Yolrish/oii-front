"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AutoResizeTextareaProps {
    value?: string
    defaultValue?: string
    placeholder?: string
    containerClassName?: string
    textAreaClassName?: string
    minHeight?: number
    maxHeight?: number
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
    disabled?: boolean
    readOnly?: boolean
    name?: string
    id?: string
    rows?: number
}

export function AutoResizeTextarea({
    value,
    defaultValue,
    placeholder = "waiting for your input...",
    containerClassName,
    textAreaClassName,
    minHeight = 40,
    maxHeight = 200,
    onChange,
    onInput,
    onKeyDown,
    onFocus,
    onBlur,
    disabled,
    readOnly,
    name,
    id,
    rows = 2,
}: AutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [textValue, setTextValue] = useState(defaultValue || "")

    const adjustHeight = () => {
        const textarea = textareaRef.current
        if (!textarea) return

        // 重置高度以获取正确的scrollHeight
        textarea.style.height = "auto"

        // 计算新高度
        const scrollHeight = textarea.scrollHeight
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)

        // 设置新高度
        textarea.style.height = `${newHeight}px`

        // 如果内容超过最大高度，显示滚动条
        if (scrollHeight > maxHeight) {
            textarea.style.overflowY = "auto"
        } else {
            textarea.style.overflowY = "hidden"
        }
    }

    useEffect(() => {
        adjustHeight()
    }, [textValue, minHeight, maxHeight])

    useEffect(() => {
        if (value !== undefined) {
            setTextValue(value)
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value

        // 如果是受控组件，不更新内部状态
        if (value === undefined) {
            setTextValue(newValue)
        }

        onChange?.(e)

        // 延迟调整高度，确保DOM已更新
        setTimeout(adjustHeight, 0)
    }

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        onInput?.(e)
        setTimeout(adjustHeight, 0)
    }

    return (
        <div className={cn(
            "relative",
            containerClassName,
        )}>
            <textarea
                ref={textareaRef}
                value={value !== undefined ? value : textValue}
                placeholder={placeholder}
                onChange={handleChange}
                onInput={handleInput}
                onFocus={onFocus}
                onBlur={onBlur}
                disabled={disabled}
                readOnly={readOnly}
                name={name}
                id={id}
                className={cn(
                    // "w-full resize-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md transition-all duration-200",
                    textAreaClassName,
                )}
                style={{
                    minHeight: `${minHeight}px`,
                    maxHeight: `${maxHeight}px`,
                    height: `${minHeight}px`,
                    overflowY: "hidden",
                }}
                onKeyDown={onKeyDown}
                rows={rows}
            />
        </div>
    )
}
