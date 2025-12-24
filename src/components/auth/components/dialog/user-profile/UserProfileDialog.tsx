'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
} from '@/components/ui/form'
import Avatar from '@/components/common/avatar/Avatar'
import { cn } from '@/lib/utils'
import { UserProfileType } from '@/types/user/user-profile-type'
import { updateUserProfileAPI } from '@/actions/auth/user-profile'
import { updateUserProfileLocal, getUserProfileLocal } from '@/utils/Auth0/User'
import { useAuthStore } from '@/components/auth/stores/auth-store'
import styles from './UserProfileDialog.module.css'
import CameraIcon from '@/components/common/icon/other/CameraIcon'
// Editable field definitions
interface EditableUserFields {
    name: string;
    // nickname: string;
    given_name: string;
    family_name: string;
    picture: string;
    bio: string;
}

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userProfile: UserProfileType;
    onProfileUpdate: (updatedProfile: UserProfileType) => void;
    onUpdateSuccess: () => void;
    onUpdateError: (error: string) => void;
}

const MAX_BIO_LENGTH = 80; // Bio最大字符限制
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 图片最大文件大小限制：5MB
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']

export function UserProfileDialog({
    open,
    onOpenChange,
    userProfile,
    onProfileUpdate,
    onUpdateSuccess,
    onUpdateError
}: UserProfileDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [bioValue, setBioValue] = useState('')
    const [errorMessage, setErrorMessage] = useState<string | null>(null) // 更新失败时的错误提示
    const { startUserProfileStorageTrigger } = useAuthStore()

    // Form setup
    const form = useForm<EditableUserFields>({
        defaultValues: {
            name: '',
            picture: '',
            bio: ''
        }
    })

    // Bio字符计数
    const bioLength = bioValue.length
    const isBioTooLong = bioLength > MAX_BIO_LENGTH

    // Initialize form values when dialog opens or userProfile changes
    useEffect(() => {
        if (userProfile) {
            const profileBio = userProfile.bio || ''
            form.reset({
                name: userProfile.name || '',
                // nickname: userProfile.metadata.nickname || '',
                picture: userProfile.picture || '',
                bio: profileBio
            })
            setBioValue(profileBio)
        }
    }, [userProfile, form])

    // Clear form when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedFile(null)
            setPreviewUrl(null)
            setSubmitLoading(false)
            setErrorMessage(null) // 清除错误信息
        }
    }, [open])

    // Handle bio change with character tracking
    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        setBioValue(value)
        form.setValue('bio', value)
    }

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // 检查文件大小是否超过5MB
            if (file.size > MAX_FILE_SIZE) {
                toast.error('Image size must be less than 5MB')
                event.target.value = ''
                return
            }

            const fileExtension = (file.name.split('.').pop() || '').toLowerCase()
            if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExtension)) {
                toast.error('Only JPG, JPEG, PNG, GIF, and WEBP images are supported')
                event.target.value = ''
                return
            }

            // Generate English filename to avoid Chinese characters
            const timestamp = Date.now()
            const randomId = Math.random().toString(36).substring(2, 8)
            const newFileName = `profile_${timestamp}_${randomId}.${fileExtension}`

            // Create a new File object with the new name
            const renamedFile = new File([file], newFileName, { type: file.type })

            setSelectedFile(renamedFile)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            form.setValue('picture', newFileName)
        }
    }

    // Handle edit submission
    const onSubmit = async (data: EditableUserFields) => {
        setSubmitLoading(true)
        setErrorMessage(null) // 清除之前的错误信息

        try {
            // Clean empty fields and compare with original data
            const formData = new FormData()
            let hasChanges = false

            // Check name field
            if (data.name && data.name.trim() !== '' && data.name.trim() !== userProfile?.name) {
                formData.append('name', data.name.trim())
                hasChanges = true
            }

            // Check bio field
            if (data.bio && data.bio.trim() !== '' && data.bio.trim() !== userProfile?.bio) {
                formData.append('bio', data.bio.trim())
                hasChanges = true
            }

            // Add file if selected (always considered a change)
            if (selectedFile) {
                formData.append('picture', selectedFile)
                hasChanges = true
            }

            // If no changes detected, show message and return
            if (!hasChanges) {
                onUpdateError('No changes detected')
                return
            }

            const user_id = userProfile?.id
            if (user_id) {
                const updateResponse = await updateUserProfileAPI(formData)
                if (updateResponse.code === 200) {
                    const success = updateUserProfileLocal(updateResponse.data)
                    if (success) {
                        // Update local state
                        const updatedProfile = getUserProfileLocal()
                        if (updatedProfile) {
                            onProfileUpdate(updatedProfile)
                        }
                        
                        //触发本地用户数据更新钩子
                        startUserProfileStorageTrigger();
                        
                        onUpdateSuccess()
                        onOpenChange(false)

                        // Reset file states
                        setSelectedFile(null)
                        setPreviewUrl(null)
                    } else {
                        // 本地更新失败时显示错误提示
                        setErrorMessage('Failed to save changes')
                        toast.error('Failed to save changes')
                        onUpdateError('Failed to update user profile')
                    }
                } else {
                    // API 返回非200状态时显示错误提示
                    setErrorMessage('Failed to save changes')
                    toast.error('Failed to update user profile')
                    throw new Error('Failed to update user profile')
                }
            }
        } catch (error) {
            // 更新失败时显示错误提示
            setErrorMessage('Failed to save changes')
            toast.error('Failed to save changes')
            onUpdateError('An error occurred during update')
            console.error('Error updating user profile:', error)
        } finally {
            setSubmitLoading(false)
        }
    }

    // Cancel edit
    const cancelEdit = () => {
        if (userProfile) {
            const profileBio = userProfile.bio || ''
            form.reset({
                name: userProfile.name || '',
                // nickname: userProfile.metadata.nickname || '',
                picture: userProfile.picture || '',
                bio: profileBio
            })
            setBioValue(profileBio)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md px-6">
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                </DialogHeader>

                {/* 更新失败错误提示 */}
                {errorMessage && (
                    <div className={cn(
                        styles.userProfileDialogErrorMessage
                    )}>
                        <span>{errorMessage}</span>
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={cn(
                        styles.userProfileDialogForm
                    )}>
                        <div className={cn(
                            styles.userProfileDialogAvatarUpload
                        )}>
                            <div className={cn(
                                styles.userProfileDialogAvatarContainer
                            )}>
                                <Avatar
                                    avatarClassName={cn(
                                        styles.userProfileDialogAvatar
                                    )}
                                    src={previewUrl ?? userProfile.picture ?? "/placeholder.svg"}
                                    alt={userProfile.name || "/placeholder.svg"}
                                    hoverAnimation={false}
                                />
                                <div
                                    className={cn(
                                        styles.userProfileDialogAvatarCameraIcon
                                    )}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    <CameraIcon />
                                </div>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.gif,.webp"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                            <div
                                className={cn(
                                    styles.userProfileDialogAvatarChange
                                )}
                                onClick={() => document.getElementById('file-input')?.click()}
                            >
                                {selectedFile ? 'Change Avatar' : 'Upload Avatar'}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <input
                                            className={styles.userProfileDialogNameInput}
                                            placeholder="Enter your name" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bio</FormLabel>
                                    <FormControl>
                                        <div className={cn(
                                            styles.userProfileDialogBioField
                                        )}>
                                            <textarea
                                                className={cn(
                                                    styles.userProfileDialogBioInput,
                                                    isBioTooLong && styles['userProfileDialogBioInput--error']
                                                )}
                                                placeholder="This user has no bio now..."
                                                value={bioValue}
                                                onChange={handleBioChange}
                                            />
                                            <div className={styles.userProfileDialogBioCharacterCount}>
                                                <span className={cn(
                                                    styles.userProfileDialogBioCharacterCountText,
                                                    bioLength > MAX_BIO_LENGTH * 0.9 && styles['userProfileDialogBioCharacterCountText--warning'],
                                                    isBioTooLong && styles['userProfileDialogBioCharacterCountText--error']
                                                )}>
                                                    {bioLength}/{MAX_BIO_LENGTH}
                                                </span>
                                            </div>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className={cn(
                            styles.userProfileDialogFormActions
                        )}>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={submitLoading}
                                className={cn(
                                    styles.userProfileDialogFormButton,
                                    styles['userProfileDialogFormButton--cancel']
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitLoading || isBioTooLong}
                                className={cn(
                                    styles.userProfileDialogFormButton,
                                    styles['userProfileDialogFormButton--save']
                                )}
                            >
                                {submitLoading && (
                                    <div className={cn(
                                        styles.userProfileDialogFormButtonSpinner
                                    )}></div>
                                )}
                                {submitLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default UserProfileDialog
