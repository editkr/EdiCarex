import { Test, TestingModule } from '@nestjs/testing';
import { SisController } from './sis.controller';

describe('SisController', () => {
  let controller: SisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SisController],
    }).compile();

    controller = module.get<SisController>(SisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
