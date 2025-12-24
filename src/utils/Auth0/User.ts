import { auth0Authentication } from "./Auth0Client";
import { isAuthenticatedLocal } from "./Authentication";
import { UserProfileType, UserProfileMetadataType, checkIsUserProfileType } from "@/types/user/user-profile-type";
import { getUserProfileAPI } from "@/actions/auth/user-profile";
/**
 * 从Auth0JS获取用户信息
 * @param accessToken 访问令牌
 * @returns {Promise<UserProfileMetadataType|null>} Auth0用户元数据或null
 */
export const getUserProfileFromAuth0 = async (accessToken?: string): Promise<UserProfileMetadataType | null> => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        // 如果没有提供accessToken，尝试从localStorage获取
        const token = accessToken || localStorage.getItem('accessToken');
        if (!token) {
            console.error('未找到访问令牌');
            return null;
        }

        return new Promise((resolve, reject) => {
            auth0Authentication.userInfo(token, (error: any, profile: any) => {
                if (error) {
                    console.error('从Auth0获取用户信息失败:', error);
                    reject(error);
                    return;
                }

                console.log('从Auth0获取用户信息成功:', profile);

                if (profile && typeof profile === 'object') {
                    // Auth0返回的是UserProfileMetadataType格式的数据
                    // 进行基本的数据验证
                    if (profile.sub && profile.email && profile.name) {
                        resolve(profile as UserProfileMetadataType);
                    } else {
                        console.error('Auth0返回的用户信息缺少必要字段');
                        resolve(null);
                    }
                } else {
                    console.error('Auth0返回的用户信息格式不正确');
                    resolve(null);
                }
            });
        });
    } catch (error) {
        console.error('获取Auth0用户信息时发生错误:', error);
        return null;
    }
};

/**
 * 从本地存储获取用户资料
 * @returns {UserProfileType|null} 用户资料对象或null
 */
export const getUserProfileLocal = (): UserProfileType | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const userStr = localStorage.getItem('user');
    if (!userStr) {
        return null;
    }

    try {
        const user = JSON.parse(userStr);
        if (checkIsUserProfileType(user)) {
            return user;
        } else {
            return null;
        }
    } catch (error) {
        console.error('解析用户资料失败:', error);
        return null;
    }
};
/**
 * 从后端 API获取用户最新资料
 * @returns {Promise<UserProfileType|null>} 用户资料对象或null
 */
export const getUserProfile = async (): Promise<UserProfileType | null> => {
    if (typeof window === 'undefined') {
        return null;
    }

    // 检查用户是否已认证
    if (!isAuthenticatedLocal()) {
        return null;
    }

    // 获取当前的访问令牌
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        return null;
    }
    console.log('开始获取用户数据')
    try {
        const response = await getUserProfileAPI();
        if (response.code === 200) {
            localStorage.setItem('user', JSON.stringify(response.data));
            return response.data as UserProfileType;
        } else {
            return null;
        }
    } catch (error) {
        console.error('获取用户在线资料失败:', error);
        // 如果在线获取失败，回退到本地存储的资料
        return null;
    }
};


/**
 * 更新用户资料
 * 注意: 这是一个本地更新，仅更新localStorage中的用户信息
 * 对于真实应用，应该调用Auth0 Management API更新服务器上的用户信息
 * @param userData 更新的用户数据
 * @returns {boolean} 更新是否成功
 */
export const updateUserProfileLocal = (userData: UserProfileType): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        // 获取当前用户资料
        const currentProfile = getUserProfileLocal();
        if (!currentProfile) {
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('更新本地用户数据1: ', userData);
            return true;
        }
        if (!checkIsUserProfileType(currentProfile)) {
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('更新本地用户数据2: ', userData);
            return true;
        }
        // const metadata = {
        //     ...currentProfile.metadata,
        //     ...userData.metadata
        // };
        // 合并新旧数据
        const updatedProfile = {
            ...currentProfile,
            ...userData,
            // metadata: metadata,
            updated_at: new Date().toISOString()
        };
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(updatedProfile));
        console.log('更新本地用户数据2: ', updatedProfile);
        return true;
    } catch (error) {
        console.error('更新用户资料失败:', error);
        return false;
    }
};

