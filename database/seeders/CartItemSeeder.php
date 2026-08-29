<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
class CartItemSeeder extends Seeder
{
 public function run(): void
 {
  $user=DB::table('users')->where('email','emma@example.com')->first(); $product=DB::table('products')->first(); if(!$user||!$product)return; DB::table('cart_items')->updateOrInsert(['user_id'=>$user->id,'product_id'=>$product->id],['gift_card_template_id'=>null,'item_type'=>'product','quantity'=>1,'price'=>$product->price,'amount'=>$product->price,'designer'=>false,'attachment_path'=>null,'attachment_name'=>null,'variation_type_option_ids'=>json_encode([]),'saved_for_later'=>false,'voucher_id'=>null,'gifted_to_email'=>null,'seat_ids'=>null,'updated_at'=>now(),'created_at'=>now()]);
 }
}
