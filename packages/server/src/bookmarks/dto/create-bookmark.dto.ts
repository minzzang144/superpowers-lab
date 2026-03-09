import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateBookmarkDto {
  @IsUrl()
  readonly url: string;

  @IsString()
  readonly title: string;

  @IsOptional()
  @IsString()
  readonly memo?: string;
}
