import {describe,it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({auth:vi.fn(),from:vi.fn()}));
vi.mock('@/lib/auth',()=>({authenticated:mocks.auth}));
import {POST,PATCH,DELETE,GET} from '../app/api/food/route';
const meal={food_name:'Rice',meal_category:'Lunch',calories:200,protein_g:4,carbs_g:44,fats_g:1};
const request=(body:unknown,url='https://aura.test/api/food')=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue({user:{id:'owner'},db:{from:mocks.from}})});
describe('food API boundaries',()=>{
 it('rejects signed-out access',async()=>{mocks.auth.mockResolvedValue({user:null,db:{from:mocks.from}});expect((await POST(request(meal))).status).toBe(401);expect((await GET(new Request('https://aura.test/api/food'))).status).toBe(401);expect(mocks.from).not.toHaveBeenCalled()});
 it('rejects ownership injection before any write',async()=>{expect((await POST(request({...meal,user_id:'other'}))).status).toBe(400);expect(mocks.from).not.toHaveBeenCalled()});
 it('rejects another account image path',async()=>{expect((await POST(request({...meal,image_url:'other/photo.jpg'}))).status).toBe(400);expect(mocks.from).not.toHaveBeenCalled()});
 it('rejects malformed IDs for updates and deletes',async()=>{expect((await PATCH(request(meal,'https://aura.test/api/food?id=bad'))).status).toBe(400);expect((await DELETE(new Request('https://aura.test/api/food?id=bad'))).status).toBe(400)});
 it('sets ownership from the authenticated user',async()=>{const insert=vi.fn().mockReturnValue({select:()=>({single:async()=>({data:{id:'saved'},error:null})})});mocks.from.mockReturnValue({insert});expect((await POST(request(meal))).status).toBe(201);expect(insert).toHaveBeenCalledWith({...meal,user_id:'owner'})});
 it('rejects malformed pagination',async()=>{expect((await GET(new Request('https://aura.test/api/food?offset=-1'))).status).toBe(400)});
});
