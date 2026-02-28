import { Test, TestingModule } from '@nestjs/testing';
import { EpidemiologyController } from './epidemiology.controller';

describe('EpidemiologyController', () => {
  let controller: EpidemiologyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpidemiologyController],
    }).compile();

    controller = module.get<EpidemiologyController>(EpidemiologyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
