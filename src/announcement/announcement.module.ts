import { Module } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { HttpModule } from '@nestjs/axios';
import { AnnouncementController } from './announcement.controller';

@Module({
  imports: [HttpModule],
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
})
export class AnnouncementModule {}
