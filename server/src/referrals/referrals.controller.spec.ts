import { Test, TestingModule } from '@nestjs/testing';
import { ReferralsController } from './referrals.controller';

describe('ReferralsController', () => {
  let controller: ReferralsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReferralsController],
    }).compile();

    controller = module.get<ReferralsController>(ReferralsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
