import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'rahul@metabull.internal' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Password@123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'ADS_MANAGER', default: 'ADS_MANAGER', enum: ['ADMIN', 'ADS_MANAGER', 'VIEWER'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ example: 'org-1', required: false })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

export class AssignAccountsDto {
  @ApiProperty({ example: ['ad-acc-uuid-1', 'ad-acc-uuid-2'], isArray: true })
  @IsArray()
  adAccountIds!: string[];

  @ApiProperty({ example: 'OWNER', enum: ['OWNER', 'EDITOR', 'VIEWER'], default: 'OWNER' })
  @IsOptional()
  @IsString()
  accessRole?: string;
}
