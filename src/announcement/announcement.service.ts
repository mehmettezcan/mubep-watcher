import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface AnnouncementData {
    title: string;
    url: string;
}

@Injectable()
export class AnnouncementService {
    private readonly logger = new Logger(AnnouncementService.name);
    private readonly mubepUrl: string;
    private readonly botToken: string;
    private readonly chatId: string;
    private readonly cronExpr: string;
    private readonly lastFile: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.mubepUrl =
            this.configService.get<string>('MUBEP_URL') || 'https://www.mubep.com.tr/';
        this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
        this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID') ?? '';
        this.cronExpr =
            this.configService.get<string>('CHECK_INTERVAL_CRON') || '*/10 * * * *';
        this.lastFile = path.join(process.cwd(), 'last.json');

        // Uygulama açıldığında da bir kere çalıştırmak istersen:
        this.checkAnnouncements().catch((err) =>
            this.logger.error('İlk kontrol hatası', err),
        );
    }

    private loadLast(): AnnouncementData | null {
        if (!fs.existsSync(this.lastFile)) {
            return null;
        }
        try {
            const raw = fs.readFileSync(this.lastFile, 'utf8');
            return JSON.parse(raw);
        } catch (e) {
            this.logger.error('last.json okunamadı', e);
            return null;
        }
    }

    private saveLast(data: AnnouncementData): void {
        fs.writeFileSync(this.lastFile, JSON.stringify(data, null, 2));
    }

    private async fetchLatestAnnouncement(): Promise<AnnouncementData> {
        const response = await firstValueFrom(
            this.httpService.get(this.mubepUrl, { timeout: 15000 }),
        );
        const $ = cheerio.load(response.data);

        // Personel alımı linkleri (href içinde "personel-alimi-" geçen ilk link)
        const firstLink = $('a[href*="personel-alimi-"]').first();

        if (!firstLink || !firstLink.attr('href')) {
            throw new Error('İlan linki bulunamadı, selector güncellenmeli.');
        }

        const title = firstLink.text().trim();
        let href = firstLink.attr('href')!.trim();

        if (href.startsWith('/')) {
            const base = new URL(this.mubepUrl);
            href = base.origin + href;
        }

        return { title, url: href };
    }

    private async sendTelegramMessage(message: string): Promise<void> {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('Telegram bilgileri yok, mesaj gönderilmeyecek.');
            return;
        }

        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

        try {
            await firstValueFrom(
                this.httpService.post(url, {
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: false,
                }),
            );
            this.logger.log('Telegram mesajı gönderildi.');
        } catch (err) {
            this.logger.error('Telegram mesajı gönderilemedi', err);
        }
    }

    // Cron ifadesini runtime'da Config üzerinden dinamik kullanamıyoruz,
    // bu yüzden burada sabit yazıyoruz, ama env'den geleni de logluyoruz.
    @Cron('0 9 * * *')
    async handleCron() {
        this.logger.log(
            `Cron tetiklendi (env CRON_EXPR: ${this.cronExpr}) - ilanlar kontrol ediliyor...`,
        );
        await this.checkAnnouncements();
    }

    // İstersen controller'dan da çağırabilmek için public tuttum
    public async checkAnnouncements(forceSend: boolean = false): Promise<void> {
        this.logger.log(`[${new Date().toISOString()}] Kontrol ediliyor...`);

        try {
            const latest = await this.fetchLatestAnnouncement();
            const last = this.loadLast();

            // Eğer manuel tetikleme yapılmışsa (forceSend = true)
            if (forceSend) {
                const msg =
                    `🟢 <b>Manuel Kontrol Yapıldı</b>\n\n` +
                    `<b>Son İlan:</b> ${latest.title}\n` +
                    `${latest.url}\n\n` +
                    `Sistem çalışıyor.`;

                await this.sendTelegramMessage(msg);
                this.logger.log('Manuel kontrol mesajı gönderildi.');
                return;
            }

            // Normal otomatik çalışma
            if (!last) {
                this.logger.log(
                    'İlk çalıştırma, mevcut ilan referans olarak kaydediliyor:',
                );
                this.saveLast(latest);
                return;
            }

            if (latest.url !== last.url) {
                this.logger.log('Yeni ilan bulundu!');
                const msg =
                    `🆕 <b>Yeni Mubep İlanı</b>\n\n` +
                    `<b>${latest.title}</b>\n${latest.url}\n\n` +
                    `Önceki ilan: ${last.title || 'bilinmiyor'}`;

                await this.sendTelegramMessage(msg);
                this.saveLast(latest);
            } else {
                this.logger.log('Yeni ilan yok.');
            }
        } catch (err: any) {
            this.logger.error(
                `Kontrol sırasında hata: ${err?.message || err}`,
                err?.stack,
            );
        }
    }

}
