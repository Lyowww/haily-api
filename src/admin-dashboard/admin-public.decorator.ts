import { SetMetadata } from '@nestjs/common';
import { ADMIN_PUBLIC_KEY } from './admin-auth.guard';

export const AdminPublic = () => SetMetadata(ADMIN_PUBLIC_KEY, true);
