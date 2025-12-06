import { Controller, Get } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('check')
  async checkNow() {
    await this.announcementService.checkAnnouncements(true);
    return { status: 'ok' };
  }
}
