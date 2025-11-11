import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import 'multer'; 

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabasekey=process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabasekey);

const BUCKET_NAME = 'group_files';

/*=== STORAGE SERVICE ===*/
export class StorageService {

    /*=== UPLOAD FILE ===*/
  static async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) {
      throw new Error('No file provided for upload.');
    }

   /*=== GENERATE UNIQUE FILE NAME ===*/
    const fileExtension = file.originalname.split('.').pop();
    const newFileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${userId}/${newFileName}`;

    /*==== FILE UPLOADING =====*/
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError.message);
      throw new Error('Failed to upload file to storage.');
    }

    /*=== GETTING FILE FIREBASE URL ===*/
    const { data: urlData } = supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path);

    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for file.');
    }
    
    console.log(`File uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  }
}