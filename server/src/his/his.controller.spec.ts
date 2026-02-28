import { Test, TestingModule } from '@nestjs/testing';
import { HisController } from './his.controller';

describe('HisController', () => {
  let controller: HisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HisController],
    }).compile();

    controller = module.get<HisController>(HisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
