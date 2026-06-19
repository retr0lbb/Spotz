import { Body, Controller, Post } from '@nestjs/common';
import { createSpotSchema, type CreateSpotDTO } from './dto/create-spot.dto';
import { SpotsService } from './spots.service';

@Controller('spots')
export class SpotsController {
    constructor(private readonly spotsService: SpotsService){}

    @Post()
    async createSpot(@Body() body: CreateSpotDTO){
        console.log(body)

        const data = createSpotSchema.parse(body)

        await this.spotsService.createSpot(data)
    }
}
