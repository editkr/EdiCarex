import { Test, TestingModule } from '@nestjs/testing';
import { ObservationRoomService } from './observation-room.service';

describe('ObservationRoomService', () => {
  let service: ObservationRoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservationRoomService],
    }).compile();

    service = module.get<ObservationRoomService>(ObservationRoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
