import {
  createIcons,
  LayoutDashboard,
  Package,
  Megaphone,
  ArrowLeftRight,
  Settings,
  Folders,
  Tag,
  SlidersHorizontal,
  UserCog,
  Store,
  LogOut,
  Menu,
  Plus,
  Save,
  Trash2,
  Eye,
  Pencil,
  X,
  ChevronRight,
  CirclePlus,
  List,
  CircleCheck,
  CircleAlert,
  History,
  ArrowRight,
  Image,
  RefreshCw,
  Link,
  WandSparkles,
} from 'lucide';

const ADMIN_ICONS = {
  LayoutDashboard,
  Package,
  Megaphone,
  ArrowLeftRight,
  Settings,
  Folders,
  Tag,
  SlidersHorizontal,
  UserCog,
  Store,
  LogOut,
  Menu,
  Plus,
  Save,
  Trash2,
  Eye,
  Pencil,
  X,
  ChevronRight,
  CirclePlus,
  List,
  CircleCheck,
  CircleAlert,
  History,
  ArrowRight,
  Image,
  RefreshCw,
  Link,
  WandSparkles,
};

export function initAdminIcons(root = document) {
  const options = {
    icons: ADMIN_ICONS,
    nameAttr: 'data-lucide',
    attrs: {
      'stroke-width': '1.75',
      'aria-hidden': 'true',
    },
  };

  if (root && root !== document) {
    options.root = root;
  }

  createIcons(options);
}
