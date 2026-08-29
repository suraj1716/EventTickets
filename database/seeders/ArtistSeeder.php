<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
class ArtistSeeder extends Seeder
{
 public function run(): void
 {
  foreach(['Tones and I','The Jungle Giants','Genesis Owusu','Jessica Mauboy','Budjerah','Thelma Plum','Guy Sebastian','Montaigne'] as $name) DB::table('artists')->updateOrInsert(['slug'=>Str::slug($name)],['name'=>$name,'updated_at'=>now(),'created_at'=>now()]);
 }
}
