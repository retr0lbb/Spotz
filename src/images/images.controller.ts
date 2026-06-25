import { Body, Controller, Param, Post } from '@nestjs/common';
import { ImagesService } from './images.service';
import { type ImageMetadataDTO, imageMetadataSchema } from './dto/image-metadata.dto';

@Controller('spots/:spotId/images')
export class ImagesController {
    constructor(private readonly imageService: ImagesService){}

    @Post("presigned")
    async generatePostUrl(@Param("spotId") spotId: string, @Body() body: ImageMetadataDTO){
        const parsedBody = imageMetadataSchema.parse(body)

        const result = await this.imageService.generateUploadUrl(spotId, parsedBody)

        return result
    }

    @Post(":imageId/confirm")
    async confirmUpload(@Param("imageId") imageId: string){

        return await this.imageService.confirmUpload(imageId)
    }



}
