import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import maxmind, { type AsnResponse, type CountryResponse, type Reader } from 'maxmind';
import { GEOIP_ASN_DB, GEOIP_COUNTRY_DB, GEOIP_DIR } from './page-views.constants.js';

export interface IpInfo {
  country: string | null;
  asn: number | null;
  asnOrg: string | null;
}

// Offline IP -> country / network lookup against the DB-IP Lite databases
// baked into the image (ADR 0019). No network calls, no Visitor IP ever
// leaves the droplet. Either database may be missing (local dev, or the
// build couldn't download it) — then the matching fields are just null.
@Injectable()
export class IpLookupService implements OnModuleInit {
  private readonly logger = new Logger(IpLookupService.name);
  private country: Reader<CountryResponse> | null = null;
  private asn: Reader<AsnResponse> | null = null;

  async onModuleInit(): Promise<void> {
    this.country = await this.open<CountryResponse>(GEOIP_COUNTRY_DB);
    this.asn = await this.open<AsnResponse>(GEOIP_ASN_DB);
  }

  lookup(ip: string): IpInfo {
    const info: IpInfo = { country: null, asn: null, asnOrg: null };
    if (!maxmind.validate(ip)) return info;
    const country = this.country?.get(ip);
    info.country = country?.country?.iso_code ?? null;
    const asn = this.asn?.get(ip);
    info.asn = asn?.autonomous_system_number ?? null;
    info.asnOrg = asn?.autonomous_system_organization ?? null;
    return info;
  }

  private async open<T extends CountryResponse | AsnResponse>(file: string): Promise<Reader<T> | null> {
    const path = join(GEOIP_DIR, file);
    if (!existsSync(path)) {
      this.logger.warn(`${path} not found — Page Views will be stored without it.`);
      return null;
    }
    try {
      return await maxmind.open<T>(path);
    } catch (err) {
      this.logger.warn(`Could not open ${path}: ${(err as Error).message}`);
      return null;
    }
  }
}
