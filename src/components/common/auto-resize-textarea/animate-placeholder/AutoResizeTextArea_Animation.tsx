"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedPlaceholderTextareaProps {
    value?: string
    defaultValue?: string
    basePlaceholder?: string
    placeholders?: string[]
    containerClassName?: string
    textAreaClassName?: string
    placeholderClassName?: string
    minHeight?: number
    maxHeight?: number
    rows?: number
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onInput?: (e: React.FormEvent<HTMLTextAreaElement>) => void
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
    disabled?: boolean
    readOnly?: boolean
    name?: string
    id?: string
    typingSpeed?: number
    deletingSpeed?: number
    pauseDuration?: number
}

export function AnimatedPlaceholderTextarea({
    value,
    defaultValue,
    basePlaceholder = "Track all information about ",
    placeholders = ["请输入内容...", "支持多行文本输入", "高度会自动调整"],
    containerClassName,
    textAreaClassName,
    placeholderClassName,
    minHeight = 40,
    maxHeight = 200,
    rows = 2,
    onChange,
    onInput,
    onKeyDown,
    onFocus,
    onBlur,
    disabled,
    readOnly,
    name,
    id,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 2000,
}: AnimatedPlaceholderTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [textValue, setTextValue] = useState(defaultValue || "")
    const [currentPlaceholder, setCurrentPlaceholder] = useState("")
    // const [basePlaceholder, setBasePlaceholder] = useState("Track all information about ")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [placeholderIndex, setPlaceholderIndex] = useState(0)

    const [isFocused, setIsFocused] = useState(false)

    const adjustHeight = () => {
        const textarea = textareaRef.current
        if (!textarea) return

        textarea.style.height = "auto"
        const scrollHeight = textarea.scrollHeight
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
        textarea.style.height = `${newHeight}px`

        if (scrollHeight > maxHeight) {
            textarea.style.overflowY = "auto"
        } else {
            textarea.style.overflowY = "hidden"
        }
    }

    // Placeholder动画逻辑
    useEffect(() => {
        if (textValue || disabled || readOnly || isFocused) {
            setCurrentPlaceholder('')
            return
        }

        if (placeholders.length === 0) {
            setCurrentPlaceholder(basePlaceholder)
            return
        }

        const currentText = placeholders[placeholderIndex]

        const animateText = () => {
            if (!isDeleting) {
                // 打字动画
                if (currentIndex < currentText.length) {
                    setCurrentPlaceholder(basePlaceholder + currentText.slice(0, currentIndex + 1))
                    setCurrentIndex(prev => prev + 1)
                } else {
                    // 完成打字，等待一段时间后开始删除
                    setTimeout(() => setIsDeleting(true), pauseDuration)
                }
            } else {
                // 删除动画
                if (currentIndex > 0) {
                    setCurrentPlaceholder(basePlaceholder + currentText.slice(0, currentIndex - 1))
                    setCurrentIndex(prev => prev - 1)
                } else {
                    // 完成删除，切换到下一个placeholder
                    setIsDeleting(false)
                    setPlaceholderIndex(prev => (prev + 1) % placeholders.length)
                }
            }
        }

        const speed = isDeleting ? deletingSpeed : typingSpeed
        const timer = setTimeout(animateText, speed)

        return () => clearTimeout(timer)
    }, [currentIndex, isDeleting, placeholderIndex, placeholders, textValue, disabled, readOnly, typingSpeed, deletingSpeed, pauseDuration])

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

        if (value === undefined) {
            setTextValue(newValue)
        }

        onChange?.(e)
        setTimeout(adjustHeight, 0)
    }

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        onInput?.(e)
        setTimeout(adjustHeight, 0)
    }

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        // 鼠标点击textarea时的操作
        onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        // 鼠标点击textarea外时的操作，即textarea失去焦点时的操作
        onBlur?.(e)
    }

    return (
        <div className={cn("relative", containerClassName)}>
            <textarea
                ref={textareaRef}
                value={value !== undefined ? value : textValue}
                onChange={handleChange}
                onInput={handleInput}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={onKeyDown}
                disabled={disabled}
                readOnly={readOnly}
                name={name}
                id={id}
                className={cn(
                    textAreaClassName,
                )}
                style={{
                    minHeight: `${minHeight}px`,
                    maxHeight: `${maxHeight}px`,
                    height: `${minHeight}px`,
                    overflowY: "hidden",
                }}
                rows={rows}
            />

            {/* 动画placeholder */}
            {!textValue && !disabled && !readOnly && (
                <div
                    className={cn(
                        placeholderClassName,
                    )}
                >
                    <span>{currentPlaceholder}</span>
                </div>
            )}
        </div>
    )
}
