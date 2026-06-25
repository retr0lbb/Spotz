import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { createSpotSchema, type CreateSpotDTO } from './dto/create-spot.dto';
import { SpotsService } from './spots.service';
import type { GetAllSpotsQuery } from './dto/getAllSpots.dto';

@Controller('spots')
export class SpotsController {
    constructor(private readonly spotsService: SpotsService){}

    @Post()
    async createSpot(@Body() body: CreateSpotDTO){

        const data = createSpotSchema.parse(body)

        await this.spotsService.createSpot(data)
    }

    @Get()
    async getSpot(@Query() query: GetAllSpotsQuery){
        const result = await this.spotsService.getAllSpots(query)

        return result
    }
}
