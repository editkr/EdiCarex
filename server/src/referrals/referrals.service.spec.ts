import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsService } from './referrals.service';

describe('ReferralsService', () => {
  let service: ReferralsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReferralsService],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
