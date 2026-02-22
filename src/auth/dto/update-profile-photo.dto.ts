import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfilePhotoDto {
  @ApiProperty({
    description: 'URL of the uploaded profile photo',
    example: 'http://localhost:3000/uploads/user-photos/abc123.jpg',
  })
  @IsString()
  @IsUrl()
  photoUrl!: string; // Definite assignment assertion - will be validated by class-validator
}

