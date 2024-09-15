import Crop from "../model/cropModel.js";

import CrudRepository from "./crud-repository.js";

class CropRepository extends CrudRepository{
    constructor(){
        super(Crop);
    }

    async findInStockCrops(){
        try {
            const crops=await Crop.find({status:'InStock'});
            return crops;
        } catch (error) {
            console.log("Something went wrong in crop repo",error);
        }
    }

    async findAllCropsWithUserId(userId){
        try {
            const crops=await Crop.find({userId:userId});
            return crops;
        } catch (error) {
            console.log("Something went wrong in repo layer",error);
        }
    }

};

export default CropRepository;