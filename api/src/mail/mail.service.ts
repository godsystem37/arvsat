import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendBookingLink(params: {
    to: string;
    offerTitle: string;
    code: string;
    url: string;
  }): Promise<void> {
    const subject = `Заявка ${params.code}: ${params.offerTitle}`;
    const text = [
      `Вы оставили заявку на «${params.offerTitle}».`,
      ``,
      `Код заявки: ${params.code}`,
      `Ссылка, чтобы посмотреть статус, отменить или запросить возврат:`,
      params.url,
      ``,
      `Сохраните это письмо — по ссылке заявка открывается без пароля.`,
    ].join('\n');

    const host = this.config.get<string>('SMTP_HOST');
    if (!host) {
      this.logger.log(
        `Письмо не отправлено (нет SMTP). Получатель: ${params.to}\nТема: ${subject}\n${text}`,
      );
      return;
    }

    this.logger.log(
      `SMTP задан, но отправка через nodemailer в MVP пишется в лог. to=${params.to}\n${text}`,
    );
  }
}
