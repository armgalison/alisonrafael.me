import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// The consent page's form (mcp-consent-page.ts): the authorization request
// echoed back from hidden fields, plus the Admin's answer.
export class ConsentDto {
  @IsString()
  @MaxLength(64)
  client_id: string;

  @IsString()
  @MaxLength(2048)
  redirect_uri: string;

  @IsString()
  @MaxLength(128)
  code_challenge: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  resource?: string;

  @IsIn(['allow', 'deny'])
  action: 'allow' | 'deny';

  // Not @IsEmail/@MinLength: a bad entry re-renders the page with an
  // error instead of a bare 400.
  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  password?: string;
}
