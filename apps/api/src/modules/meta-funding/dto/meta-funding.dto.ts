import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class CreateFundingRequestDto {
  @IsUUID() fundLotId!: string;
  @IsOptional() @IsUUID() targetAdAccountId?: string;
  @Matches(/^[1-9]\d*$/) amountMinor!: string;
  @IsIn(['INR']) currencyCode: 'INR' = 'INR';
  @IsString() @Length(1, 240) purpose!: string;
}

export class MapTopupDto {
  @IsString() @Length(8, 128) idempotencyKey!: string;
  @IsOptional() @IsUUID() detectedAdAccountId?: string;
  @IsUUID() selectedAdAccountId!: string;
  @IsOptional() @Matches(/^[1-9]\d*$/) detectedAmountMinor?: string;
  @Matches(/^[1-9]\d*$/) selectedAmountMinor!: string;
  @IsIn(['INR']) currencyCode: 'INR' = 'INR';
  @IsIn(['FUNDING_REQUEST', 'FUND_LOT']) fundingSourceType!: 'FUNDING_REQUEST' | 'FUND_LOT';
  @IsOptional() @IsUUID() fundingRequestId?: string;
  @IsOptional() @IsUUID() fundLotId?: string;
  @IsOptional() @Matches(/^\d{5,32}$/) detectedMetaAccountId?: string;
  @IsOptional() @Matches(/^\d{5,32}$/) visibleMetaAccountId?: string;
  @IsString() @Length(1, 32) detectorVersion!: string;
}

export class ObserveTopupDto {
  @IsString() @Length(8, 128) idempotencyKey!: string;
  @IsOptional() @Matches(/^[1-9]\d*$/) observedAmountMinor?: string;
  @IsOptional() @Matches(/^\d{5,32}$/) visibleMetaAccountId?: string;
  @IsOptional() @IsString() @MaxLength(32) detectorVersion?: string;
}

export class ReviewTopupDto {
  @IsIn(['CONFIRM', 'REJECT']) decision!: 'CONFIRM' | 'REJECT';
  @IsOptional() @IsString() @Length(1, 240) reason?: string;
}

export class ActivityQueryDto {
  @ApiPropertyOptional({ default: 1 }) @IsOptional() page?: string;
  @ApiPropertyOptional({ default: 25 }) @IsOptional() pageSize?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewState?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['true']) readyForReview?: string;
}

export class CancelFundingRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(240) reason?: string;
}
