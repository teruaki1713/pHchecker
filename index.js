let ImgElement = document.getElementById('ImgSrc');
let InputElement = document.getElementById('fileInput');
let CanvasElement = document.getElementById('Canvas');
let CanvasCon = CanvasElement.getContext('2d');

let total_red = [];
let total_red_flat = [];
let total_green = [];
let total_green_flat = [];
let total_blue = [];
let total_blue_flat = [];
for(var i = 0; i < 256; i++)
{
    total_red.push(0);
    total_green.push(0);
    total_blue.push(0);
}
let total = 0;


let Q1 = 0;
let Q2 = 0;
let Q3 = 0;
let avg = 0;
let mode = 0;
let max = 0;
let min = 0;
let ss = 0;

//後々自作コードへ変換
const shuffle = ([...array]) => {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createImageData(img) {

    var cv = document.createElement('canvas');
  
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
  
    var ct = cv.getContext('2d');
    ct.drawImage(img, 0, 0);
    var data = ct.getImageData(0, 0, cv.width, cv.height);

    return data;
}


let N = 0;

class IMG_DATA
{
    constructor(Element,name)
    {
        //img要素に画像を挿入
        ImgElement.src = URL.createObjectURL(Element);

        //画像の個体ナンバーを取得
        this.Number = N;

        setTimeout(()=>{
            //画像情報
            this.ImgData = createImageData(ImgElement);

            this.Height  = ImgElement.height;
            this.Width   = ImgElement.width;
            this.name = name;

            CanvasElement.width  = this.Width;
            CanvasElement.height = this.Height;

            //カラー画素情報
            var sample = [];
            for(var i = 0; i < this.ImgData.data.length; i++)
            {
                sample.push(this.ImgData.data[i]);
            }
            this.ImgData_pixel_color = sample;

            //グレースケール画素情報
            var sample = [];
            for(var i = 0; i < (this.ImgData_pixel_color.length)/4; i++)
            {
                sample.push( Math.floor( (this.ImgData_pixel_color[(i*4)] * 0.299) + (this.ImgData_pixel_color[(i*4)+1] * 0.587) + (this.ImgData_pixel_color[(i*4)+2] * 0.114) ));
            }
            this.ImgData_pixel_gray = sample;

            //グレースケール　各値ごとの画素数(256段階 0 ~ 255)
            var sample = [];
            for(var i = 0; i < 256; i++)
            {
                sample.push(0);
            }
            for(var i = 0; i < this.ImgData_pixel_gray.length; i++)
            {
                sample[this.ImgData_pixel_gray[i]] += 1;
            }
            this.ImgData_pixel_gray_number = sample;

            //大津の二値化　→　閾値(T)を探す#####################################################################################################################################################################
            let DistributedData = [];
            for(var t = 0; t < 256; t++)
            {
                //和を算出
                var Group1_sum = 0;
                var Group1_PointSum = 0;
                var Group2_sum = 0;
                var Group2_PointSum = 0;
                for(var i = 0; i < t; i++)
                {
                    Group1_sum += (this.ImgData_pixel_gray_number[i] * i)
                    Group1_PointSum += this.ImgData_pixel_gray_number[i];
                }
                for(var i = t; i < 256; i++)
                {
                    Group2_sum += (this.ImgData_pixel_gray_number[i] * i);
                    Group2_PointSum += this.ImgData_pixel_gray_number[i];
                }

                //平均値を算出
                let Group1_avg = 0;
                let Group2_avg = 0;
                if(Group1_sum == 0)
                {
                    Group1_avg = 0;
                }
                else
                {
                    Group1_avg = Math.floor(Group1_sum / Group1_PointSum);
                }
                if(Group2_sum == 0)
                {
                    Group2_avg = 0;
                }
                else
                {
                    Group2_avg = Math.floor(Group2_sum / Group2_PointSum);
                }

                //分散を算出
                var Group1_distributed = 0;
                var Group2_distributed = 0;
                for(var i = 0; i < t; i++)
                {
                    Group1_distributed += this.ImgData_pixel_gray_number[i] * ((i - Group1_avg)**2);
                }
                for(var i = t; i < 256; i++)
                {
                    Group2_distributed += this.ImgData_pixel_gray_number[i] * ((i - Group2_avg)**2);
                }

                if(Group1_PointSum == 0)
                {
                    Group1_distributed = 0;
                }
                else
                {
                    Group1_distributed /= Group1_PointSum;
                }
                if(Group2_PointSum == 0)
                {
                    Group2_distributed = 0;
                }
                else
                {
                    Group2_distributed /= Group2_PointSum;
                }

                //Group1の分散とGroup2の分散の差を取る
                DistributedData.push(Math.abs(Math.floor(Group1_distributed) - Math.floor(Group2_distributed)));
            }

            //閾値を設定
            this.T = DistributedData.indexOf(Math.min.apply(null,DistributedData));
            console.log(this.T);

            //閾値未満、以上に仕分ける
            let LowerPoint = [];
            for(var i = 0; i < this.ImgData_pixel_gray.length; i++)
            {
                if(this.ImgData_pixel_gray[i] < this.T)
                {
                    LowerPoint.push(i);
                }
            }
            this.LowerPoint = LowerPoint;

            //閾値未満の値の座標をとる
            let Point = [];
            for(var i = 0; i < this.LowerPoint.length; i++)
            {
                var sample = [];
                sample.push(this.LowerPoint[i] % this.Width);//X座標
                sample.push(Math.floor(this.LowerPoint[i] / this.Width));//Y座標
                Point.push(sample);
            }

            //座標の平均値をとる
            let x_point_sum = 0;
            let y_point_sum = 0;
            for(var i = 0; i < Point.length; i++)
            {
                x_point_sum += Point[i][0];
                y_point_sum += Point[i][1];
            }
            this.PointAvg = [x_point_sum/Point.length , y_point_sum/Point.length];

            //座標の平均(基準点)からの距離の平均を取る
            let PointDistance = [];
            for(var i = 0; i < Point.length; i++)
            {
                PointDistance.push(Math.floor(Math.sqrt( (this.PointAvg[0] - Point[i][0])**2 + (this.PointAvg[1] - Point[i][1])**2 )));
            }

            //基準点からの平均の距離
            let PointDistance_sum = 0;
            for(var i = 0; i < PointDistance.length; i++)
            {
                PointDistance_sum += PointDistance[i];
            }
            let PointDistance_avg = PointDistance_sum / PointDistance.length;

            //平均距離以上の点を除外
            var sample = [];
            for(var i = 0; i < Point.length; i++)
            {
                if(PointDistance_avg > PointDistance[i])
                {
                    sample.push(Point[i]);
                }
            }

            //対象物の座標
            let TargetPoint = sample;

            //############################################################################################################################################################################################

            //座標データをインデックス番号へ変換
            var sample = [];
            for(var i = 0; i < TargetPoint.length; i++)
            {
                sample.push(TargetPoint[i][0] + (TargetPoint[i][1] * this.Width));
            }
            this.TargetPoint = sample;

            //ターゲットのRGB値を取得
            let RedPoint   = [];
            let GreenPoint = [];
            let BluePoint  = [];
            for(var i = 0; i < this.TargetPoint.length; i++)
            {
                var red   = this.ImgData_pixel_color[(this.TargetPoint[i] * 4)    ]
                var green = this.ImgData_pixel_color[(this.TargetPoint[i] * 4) + 1];
                var blue  = this.ImgData_pixel_color[(this.TargetPoint[i] * 4) + 2];

                total_red[this.ImgData_pixel_color[(this.TargetPoint[i] *   4)    ]] += 1;
                total_green[this.ImgData_pixel_color[(this.TargetPoint[i] * 4) + 1]] += 1;
                total_blue[this.ImgData_pixel_color[(this.TargetPoint[i] *  4) + 2]] += 1;

                RedPoint.push(red);
                GreenPoint.push(green);
                BluePoint.push(blue);
            }
            this.RedPoint   = RedPoint;
            this.GreenPoint = GreenPoint;
            this.BluePoint  = BluePoint;

            mode = [total_red.indexOf(Math.max.apply(null,total_red)) , total_green.indexOf(Math.max.apply(null,total_green)) , total_blue.indexOf(Math.max.apply(null,total_blue))];
            total += this.TargetPoint.length;
            total_red_flat   = [];
            total_green_flat = [];
            total_blue_flat  = [];
            
            for(var i = 0; i < 256; i++)
            {
                for(var ii = 0; ii < total_red[i]; ii++)
                {
                    total_red_flat.push(i);
                }

                for(var ii = 0; ii < total_green[i]; ii++)
                {
                    total_green_flat.push(i);
                }

                for(var ii = 0; ii < total_blue[i]; ii++)
                {
                    total_blue_flat.push(i);
                }
            }

            var sample1 = [];
            var sample2 = [];
            var sample3 = [];
            for(var i = 0; i<256; i++)
            {
                sample1.push(0);
                sample2.push(0);
                sample3.push(0);
            }
            for(var i = 0; i < total_red_flat.length; i++)
            {
                sample1[total_red_flat[i]] += 1;
                sample2[total_green_flat[i]] += 1;
                sample3[total_blue_flat[i]] += 1;
            }
            console.log(sample1);
            console.log(sample2);
            console.log(sample3);

            //ターゲットの平均RGB値を算出
            var sum1 = 0;
            var sum2 = 0;
            var sum3 = 0;
            for(var i = 0; i < this.TargetPoint.length; i++)
            {
                sum1 += this.RedPoint[i];
                sum2 += this.GreenPoint[i];
                sum3 += this.BluePoint[i];
            }
            this.RedAverage   = Math.floor(sum1/TargetPoint.length);
            this.GreenAverage = Math.floor(sum2/TargetPoint.length);
            this.BlueAverage  = Math.floor(sum3/TargetPoint.length);
            this.AverageRGB = [this.RedAverage,this.GreenAverage,this.BlueAverage];

            //背景の座標を取得
            let PaintedImg = this.ImgData;
            sample = this.ImgData.data;
            for(var i = 0; i < sample.length; i++)
            {
                sample[i] = 255;
            }
            for(var i = 0; i < this.TargetPoint.length; i++)
            {
                sample[(this.TargetPoint[i]*4)  ] = this.ImgData_pixel_color[(this.TargetPoint[i]*4)  ];
                sample[(this.TargetPoint[i]*4)+1] = this.ImgData_pixel_color[(this.TargetPoint[i]*4)+1];
                sample[(this.TargetPoint[i]*4)+2] = this.ImgData_pixel_color[(this.TargetPoint[i]*4)+2];
                sample[(this.TargetPoint[i]*4)+3] = this.ImgData_pixel_color[(this.TargetPoint[i]*4)+3];
            }
            for(var i = 0; i < PaintedImg.data.length; i++)
            {
                PaintedImg.data[i] = sample[i];
            }
            this.PaintedImg = PaintedImg;

            Q1 = Math.floor(total/4    );
            Q2 = Math.floor(total/4 * 2);
            Q3 = Math.floor(total/4 * 3);

            Q1 = [ (total_red_flat[Q1]) , (total_green_flat[Q1]) , (total_blue_flat[Q1]) ];
            Q2 = [ (total_red_flat[Q2]) , (total_green_flat[Q2]) , (total_blue_flat[Q2]) ];
            Q3 = [ (total_red_flat[Q3]) , (total_green_flat[Q3]) , (total_blue_flat[Q3]) ];

            min = [ (total_red_flat[0]) , (total_green_flat[0]) , (total_blue_flat[0]) ];
            max = [ (total_red_flat[total-1]) , (total_green_flat[total-1]) , (total_blue_flat[total-1]) ];

            var sample1 = 0;
            var sample2 = 0;
            var sample3 = 0;
            for(var i = 0; i < 256; i++)
            {
                sample1 += total_red[i]   * i;
                sample2 += total_green[i] * i;
                sample3 += total_blue[i]  * i;
            }
            avg = [ Math.floor(sample1 / total) , Math.floor(sample2 / total) , Math.floor(sample3 / total) ];

            var sample1 = 0;
            var sample2 = 0;
            var sample3 = 0;
            for(var i = 0; i < total_red.length; i++)
            {
                sample1 += total_red[i]   * ((i - this.RedAverage)  **2);
                sample2 += total_green[i] * ((i - this.GreenAverage)**2);
                sample3 += total_blue[i]  * ((i - this.BlueAverage) **2);
            }
            ss = [Math.floor(sample1/total_red_flat.length) , Math.floor(sample2/total_green_flat.length) , Math.floor(sample3/total_blue_flat.length)];

            $("#total_result_lists").html(
                '<li><p>N : '+ total +'</p></li>'+
                '<li><p>Mode : [ '+ mode +' ]</p></li>'+
                '<li><p>Average : [ '+ avg +' ]</p></li>'+
                '<li><p>SS : [ '+ ss +' ]</p></li>'+
                '<li><p>Min : [ '+ min +' ]</p></li>'+
                '<li><p>Q1 : [ '+ Q1 +' ]</p></li>'+
                '<li><p>Q2 : [ '+ Q2 +' ]</p></li>'+
                '<li><p>Q3 : [ '+ Q3 +' ]</p></li>'+
                '<li><p>Max : [ '+ max +' ]</p></li>'
            );
        },100);

        setTimeout(()=>{
            CanvasCon.putImageData(this.ImgData,0,0);

            $('#result_lists').append(
                '<li>'+
                    '<div class="left">'+
                        '<img src="" alt="" id = "result'+ (this.Number) +'">'+
                    '</div>'+
                    '<div class="right">'+
                        '<p>No.'+ (this.Number + 1) +'</p>'+
                        '<p>Name : '+ this.name +'</p>'+
                        '<p>Average : ['+ this.AverageRGB +']</p>'+
                    '</div>'+
                '</li>'
            );

            setTimeout(()=>{
                let ImgOutput = document.getElementById('result'+this.Number+'');
                ImgOutput.src = CanvasElement.toDataURL('image/jpeg',1);
            },300);
        },200);

        N++;
    }
}

let Data = [];

InputElement.addEventListener('change', (ev) => {
    i = 0;

    let roop = setInterval(()=>{
        let object = new IMG_DATA(ev.target.files[i],ev.target.files[i].name);
        Data.push(object);

        if(i == ev.target.files.length-1){
            clearInterval(roop);
        }
        i++;
    },5000);
}, false);


var va = 0;

