import { Test, TestingModule } from '@nestjs/testing';
import { EpidemiologyService } from './epidemiology.service';

describe('EpidemiologyService', () => {
  let service: EpidemiologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EpidemiologyService],
    }).compile();

    service = module.get<EpidemiologyService>(EpidemiologyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
