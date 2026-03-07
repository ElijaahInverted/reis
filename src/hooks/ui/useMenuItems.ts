import { getMainMenuItems } from '../../components/menuConfig';
import { useUserParams } from '../useUserParams';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../useTranslation';
import type { MenuItem } from '../../components/menuConfig';

export function useMenuItems(): MenuItem[] {
  const { params } = useUserParams();
  const language = useAppStore(state => state.language);
  const { t } = useTranslation();

  return getMainMenuItems(params?.studium ?? '', params?.obdobi ?? '', t, language);
}
