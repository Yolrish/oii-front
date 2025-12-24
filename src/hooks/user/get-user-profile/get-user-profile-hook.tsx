import useSWR from "swr";
import { getUserProfileByIdAction } from "./get-user-profile-action";

export function useUserProfileById(user_id: string) {
    const { data, error, isLoading } = useSWR(user_id, getUserProfileByIdAction, {
        refreshWhenHidden: false,       // 页面隐藏时，不重新验证
        refreshWhenOffline: false,      // 网络离线时，不重新验证
    })

    return {
        user: data,
        isLoading,
        isError: error,
    }
}