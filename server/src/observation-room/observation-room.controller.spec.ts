import { Test, TestingModule } from '@nestjs/testing';
import { ObservationRoomController } from './observation-room.controller';

describe('ObservationRoomController', () => {
  let controller: ObservationRoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservationRoomController],
    }).compile();

    controller = module.get<ObservationRoomController>(ObservationRoomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
