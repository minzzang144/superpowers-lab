import { IsString, IsUrl, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBookmarkDto {
  @IsOptional()
  @IsUrl()
  readonly url?: string;

  @IsOptional()
  @IsString()
  readonly title?: string;

  @IsOptional()
  @IsString()
  readonly memo?: string;

  @IsOptional()
  @IsBoolean()
  readonly isFavorite?: boolean;
}
