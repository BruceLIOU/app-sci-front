import { useSelector } from 'react-redux'
import { RootState } from '../store'

const useIsAdmin = (): boolean => {
  const role = useSelector((state: RootState) => state.auth.user?.role ?? 'viewer')
  return role === 'admin'
}

export default useIsAdmin
