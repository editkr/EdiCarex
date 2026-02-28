import { Test, TestingModule } from '@nestjs/testing';
import { HisService } from './his.service';

describe('HisService', () => {
  let service: HisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HisService],
    }).compile();

    service = module.get<HisService>(HisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
